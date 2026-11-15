import { Vault } from "../../local-data/assets/engine.js";

const ENTITY = "mission";
const keyOf = id => "mission:" + String(id);

export const MissionStore = Object.freeze({
  async status() {
    const status = await Vault.status();
    if (!status.exists) return { ...status, unlocked: false, records: 0, conflicts: 0 };
    try {
      const snapshot = await Vault.snapshot();
      const records = snapshot.records.filter(row => row.entity === ENTITY);
      const conflicts = snapshot.conflicts.filter(row => row.tips.some(tip => tip.body?.entity === ENTITY));
      return { ...status, unlocked: true, records: records.length, conflicts: conflicts.length };
    } catch {
      return { ...status, unlocked: false, records: 0, conflicts: 0 };
    }
  },
  unlock() { return Vault.unlock(); },
  lock() { Vault.lock(); },
  async list() {
    const snapshot = await Vault.snapshot();
    return snapshot.records
      .filter(row => row.entity === ENTITY)
      .map(row => ({ id: row.recordId.slice("mission:".length), ...row.data, _changeId: row.changeId, _updatedAt: row.updatedAt }))
      .sort((a,b) => String(b._updatedAt).localeCompare(String(a._updatedAt)));
  },
  async get(id) {
    return (await this.list()).find(row => row.id === String(id)) || null;
  },
  async save(data, id) {
    Vault.ensure();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("اطلاعات مأموریت باید یک شیء معتبر باشد.");
    const missionId = String(id || data.id || (crypto.randomUUID ? crypto.randomUUID() : "mission-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)));
    const prior = await this.get(missionId);
    const now = new Date().toISOString();
    const record = { ...data, id: missionId, schemaVersion: Number(data.schemaVersion ?? prior?.schemaVersion ?? 1), createdAt: data.createdAt || prior?.createdAt || now, updatedAt: now };
    await Vault.add(ENTITY, keyOf(missionId), "upsert", record);
    const verified = await this.get(missionId);
    if (!verified || verified.updatedAt !== record.updatedAt) throw new Error("ثبت مأموریت تأیید نشد؛ ذخیره‌ساز محلی نتوانست رکورد را پس از ثبت بازیابی کند. صفحه را نبندید و وضعیت ذخیره‌سازی محلی را بررسی کنید.");
    return missionId;
  },
  async remove(id) {
    Vault.ensure();
    const prior = await this.get(id);
    if (!prior) return false;
    await Vault.add(ENTITY, keyOf(id), "delete", { id: String(id), deletedAt: new Date().toISOString() });
    return true;
  },
  async config() {
    const snapshot = await Vault.snapshot();
    const row = snapshot.records.find(item => item.entity === "mission-config" && item.recordId === "mission-config:form-schema");
    return row?.data || null;
  },
  async saveConfig(data) {
    Vault.ensure();
    if (!data || typeof data !== "object" || !Array.isArray(data.departments)) throw new Error("ساختار پیکربندی معتبر نیست.");
    const prior = (await Vault.snapshot()).records.find(item => item.entity === "mission-config" && item.recordId === "mission-config:form-schema");
    await Vault.add("mission-config", "mission-config:form-schema", "upsert", { ...data, version: Number(prior?.data?.version || 0) + 1, updatedAt: new Date().toISOString() });
    return this.config();
  },
  async addProgress(id, entry) {
    Vault.ensure();
    const prior = await this.get(id);
    if (!prior) throw new Error("پرونده مأموریت پیدا نشد.");
    const updates = Array.isArray(prior.progressLog) ? prior.progressLog.slice() : [];
    updates.push({ id: crypto.randomUUID(), at: new Date().toISOString(), ...entry });
    const nextProgress = Math.max(0, Math.min(100, Number(entry.progress ?? prior.progress ?? 0)));
    return this.save({ ...prior, progress: nextProgress, progressLog: updates, lastProgressAt: new Date().toISOString() }, id);
  },
  async getMeta(key) {
    const snapshot = await Vault.snapshot();
    const row = snapshot.records.find(item => item.entity === "mission-meta" && item.recordId === "mission-meta:" + String(key));
    return row?.data || null;
  },
  async saveMeta(key, data) {
    Vault.ensure();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("ساختار داده تکمیلی معتبر نیست.");
    await Vault.add("mission-meta", "mission-meta:" + String(key), "upsert", { ...data, updatedAt: new Date().toISOString() });
    return this.getMeta(key);
  },
  async exportBankBackup() {
    const raw = JSON.parse(await Vault.export());
    const changes = (raw.payload?.changes || []).filter(row =>
      ["mission", "mission-config", "mission-meta"].includes(row.body?.entity)
    );
    const attachments = (raw.payload?.attachments || []).filter(row =>
      row.data?.meta?.entity === "mission"
    );
    const missions = changes.filter(row => row.body?.entity === "mission").length;
    const backup = {
      format: "H7MISSIONBANK",
      version: 1,
      createdAt: new Date().toISOString(),
      counts: { changes: changes.length, missionChanges: missions, missions: new Set(changes.filter(row => row.body?.entity === "mission").map(row => row.body.recordId)).size, attachments: attachments.length },
      payload: { changes, attachments }
    };
    return JSON.stringify(backup, null, 2);
  },
  async importBankBackup(text) {
    let backup;
    try { backup = JSON.parse(text); }
    catch { throw new Error("فایل انتخاب‌شده JSON معتبر نیست."); }
    if (backup?.format !== "H7MISSIONBANK" || backup?.version !== 1 ||
        !Array.isArray(backup.payload?.changes) || !Array.isArray(backup.payload?.attachments)) {
      throw new Error("این فایل، پشتیبان معتبر بانک مأموریت‌های معاونت ۷ نیست.");
    }
    const allowed = new Set(["mission", "mission-config", "mission-meta"]);
    for (const row of backup.payload.changes) {
      if (!row?.changeId || !row?.body || !allowed.has(row.body.entity)) {
        throw new Error("ساختار تغییرات داخل فایل پشتیبان معتبر نیست.");
      }
    }
    for (const row of backup.payload.attachments) {
      if (!row?.attachmentId || typeof row.data?.content !== "string" ||
          row.data?.meta?.entity !== "mission") {
        throw new Error("ساختار پیوست‌های فایل پشتیبان معتبر نیست.");
      }
    }
    const packageForVault = {
      format: "H7BACKUP",
      version: 2,
      mode: "plain",
      payload: {
        format: "company-seven-backup",
        schemaVersion: 1,
        createdAt: backup.createdAt || new Date().toISOString(),
        sourceDevice: "mission-bank-backup",
        changes: backup.payload.changes,
        attachments: backup.payload.attachments
      }
    };
    return Vault.import(JSON.stringify(packageForVault));
  },
  async summary() {
    const snapshot = await Vault.snapshot();
    const records = snapshot.records.filter(row => row.entity === ENTITY);
    const conflicts = snapshot.conflicts.filter(row => row.tips.some(tip => tip.body?.entity === ENTITY));
    return { records: records.length, conflicts: conflicts.length, changes: snapshot.changeCount, corrupt: snapshot.corruptCount };
  }
});

export { Vault as MissionVault };
