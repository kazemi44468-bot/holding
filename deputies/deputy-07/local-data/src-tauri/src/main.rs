#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() { tauri::Builder::default().run(tauri::generate_context!()).expect("اجرای نرم‌افزار مرکز داده شرکت هفت ناموفق بود"); }
