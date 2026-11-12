#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{fs, path::PathBuf, time::{SystemTime, UNIX_EPOCH}};
use tauri::{AppHandle, Manager};

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

#[tauri::command]
fn save_vault_snapshot(app: AppHandle, content: String) -> Result<String, String> {
    let dir = data_dir(&app)?;
    let target = dir.join("vault-state.h7vault");
    if target.exists() {
        let backup_dir = dir.join("snapshots");
        fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
        let modified = fs::metadata(&target).and_then(|m| m.modified()).ok();
        let old_enough = modified.map(|t| t.elapsed().unwrap_or_default().as_secs() >= 86400).unwrap_or(true);
        if old_enough {
            let stamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
            let archived = backup_dir.join(format!("vault-auto-{}.h7vault", stamp));
            fs::copy(&target, archived).map_err(|e| e.to_string())?;
        }
    }
    let temp = dir.join("vault-state.h7vault.tmp");
    fs::write(&temp, content).map_err(|e| e.to_string())?;
    fs::rename(&temp, &target).map_err(|e| e.to_string())?;
    Ok(target.to_string_lossy().to_string())
}

#[tauri::command]
fn load_vault_snapshot(app: AppHandle) -> Result<Option<String>, String> {
    let target = data_dir(&app)?.join("vault-state.h7vault");
    if !target.exists() { return Ok(None); }
    fs::read_to_string(target).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_backup_file(app: AppHandle, file_name: String, content: String) -> Result<String, String> {
    let dir = data_dir(&app)?.join("backups");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let safe_name: String = file_name.chars().filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_' || *c == '.').collect();
    let name = if safe_name.ends_with(".h7backup") { safe_name } else { format!("{}.h7backup", safe_name) };
    let target = dir.join(name);
    fs::write(&target, content).map_err(|e| e.to_string())?;
    Ok(target.to_string_lossy().to_string())
}

#[tauri::command]
fn get_storage_path(app: AppHandle) -> Result<String, String> {
    Ok(data_dir(&app)?.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_vault_snapshot, load_vault_snapshot, save_backup_file, get_storage_path])
        .run(tauri::generate_context!())
        .expect("اجرای نرم‌افزار مرکز داده شرکت هفت ناموفق بود");
}
