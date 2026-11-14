import { MissionStore, MissionVault } from "./mission-store.js";
const $ = id => document.getElementById(id);
let unlocked = false;
const fmt = value => Number(value || 0).toLocaleString("fa-IR");
function setUnlocked(value) {
  unlocked = value;
  $("lockBadge").textContent = value ? "باز است" : "قفل است";
  $("lockBadge").classList.toggle("open", value);
  $("unlockBtn").disabled = value;
  $("passphrase").disabled = value;
  for (const id of ["lockBtn","exportBtn","importFile","refreshBtn"]) $(id).disabled = !value;
}
function show(id, value) { $(id).textContent = value; }
async function refresh() {
  if (!unlocked) return;
  const [summary, status, missions] = await Promise.all([MissionStore.summary(), MissionVault.counts(), MissionStore.list()]);
  show("missionCount", fmt(summary.records));
  show("conflictCount", fmt(summary.conflicts));
  show("changeCount", fmt(summary.changes));
  show("deviceId", status.device);
  $("deviceId").style.fontSize = "12px";
  $("missionList").replaceChildren();
  if (!missions.length) {
    $("missionList").textContent = "هنوز مأموریتی در پایگاه داده محلی ثبت نشده است.";
  } else {
    for (const mission of missions.slice(0, 30)) {
      const row = document.createElement("div"); row.className = "sync-row";
      const title = document.createElement("strong");
      title.textContent = mission.title || mission.subject || ("مأموریت " + mission.id.slice(0, 8));
      const meta = document.createElement("small");
      meta.textContent = "شناسه: " + mission.id + " · آخرین تغییر: " + new Date(mission._updatedAt).toLocaleString("fa-IR");
      row.append(title, meta); $("missionList").append(row);
    }
  }
  show("vaultState", "مخزن محلی باز است. اطلاعات مأموریت‌ها از پایگاه داده مشترک معاونت ۷ خوانده می‌شود.");
}
$("unlockBtn").addEventListener("click", async () => {
  try {
    const device = await MissionStore.unlock($("passphrase").value);
    $("passphrase").value = ""; setUnlocked(true);
    show("vaultState", "مخزن با موفقیت بازگشایی شد. شناسه رایانه: " + device);
    show("transferResult", "اتصال به پایگاه داده محلی برقرار شد.");
    await refresh();
  } catch (error) { show("vaultState", error.message); }
});
$("lockBtn").addEventListener("click", () => {
  MissionStore.lock(); setUnlocked(false);
  for (const id of ["missionCount","conflictCount","changeCount","deviceId"]) show(id, "—");
  $("missionList").textContent = "مخزن قفل است.";
  show("transferResult", "مخزن قفل شد.");
});
$("refreshBtn").addEventListener("click", async () => { try { await refresh(); } catch (error) { show("transferResult", error.message); } });
$("exportBtn").addEventListener("click", async () => {
  try {
    const content = await MissionVault.export();
    const name = "deputy-07-offline-update-" + new Date().toISOString().slice(0,10) + ".h7backup";
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
    show("transferResult", "بسته تبادل بدون رمز ساخته شد. این بسته شامل کل مخزن مرکز داده معاونت ۷ است؛ آن را فقط در مسیر انتقال مورد اعتماد نگهداری کنید.");
  } catch (error) { show("transferResult", error.message); }
});
$("importFile").addEventListener("change", async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const raw = await file.text();
    const legacy = JSON.parse(raw);
    let pass = "";
    if (legacy.version === 1) { pass = prompt("این بسته قدیمی رمزگذاری‌شده است؛ رمز همان بسته را وارد کنید:") || ""; if (!pass) return; }
    const result = await MissionVault.import(raw, pass);
    show("transferResult", "ادغام انجام شد: " + fmt(result.added) + " تغییر جدید، " + fmt(result.duplicates) + " مورد تکراری، " + fmt(result.conflicts) + " تعارض و " + fmt(result.records) + " رکورد قابل استفاده.");
    await refresh();
  } catch (error) { show("transferResult", error.message); }
  finally { event.target.value = ""; }
});
const status = await MissionVault.status();
if (status.exists) show("vaultState", "مخزن قبلاً ایجاد شده است. با همان گذرواژه اصلی مرکز داده آن را بازگشایی کنید.");
