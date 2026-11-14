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
  unlock(passphrase) { return Vault.unlock(passphrase); },
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
    const missionId = String(id || data.id || crypto.randomUUID());
    const prior = await this.get(missionId);
    const now = new Date().toISOString();
    const record = { ...data, id: missionId, schemaVersion: 1, createdAt: data.createdAt || prior?.createdAt || now, updatedAt: now };
    await Vault.add(ENTITY, keyOf(missionId), "upsert", record);
    return missionId;
  },
  async remove(id) {
    Vault.ensure();
    const prior = await this.get(id);
    if (!prior) return false;
    await Vault.add(ENTITY, keyOf(id), "delete", { id: String(id), deletedAt: new Date().toISOString() });
    return true;
  },
  async summary() {
    const snapshot = await Vault.snapshot();
    const records = snapshot.records.filter(row => row.entity === ENTITY);
    const conflicts = snapshot.conflicts.filter(row => row.tips.some(tip => tip.body?.entity === ENTITY));
    return { records: records.length, conflicts: conflicts.length, changes: snapshot.changeCount, corrupt: snapshot.corruptCount };
  }
});

export { Vault as MissionVault };
