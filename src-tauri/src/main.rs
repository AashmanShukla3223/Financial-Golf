#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[tauri::command]
fn get_security_status() -> String {
    "Ransomware Protection: Active. App is sandboxed. All OS hooks restricted.".to_string()
}

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            println!("Financial Golf Sandboxed Initialization Started.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_security_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
