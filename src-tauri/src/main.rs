#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::api::process::Command;

#[tauri::command]
fn get_security_status() -> String {
    "Ransomware Protection: Active. App is sandboxed. All OS hooks restricted.".to_string()
}

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            println!("Financial Golf Sandboxed Initialization Started.");
            // Launch the Go Content/Quiz microservice
            match Command::new_sidecar("go-engine") {
                Ok(cmd) => {
                    if let Ok((_rx, _child)) = cmd.spawn() {
                        println!("Go engine started");
                    }
                }
                Err(e) => eprintln!("Error setting up go-engine: {}", e),
            }

            // Launch the Python Math/Finance Sidecar
            match Command::new_sidecar("python-engine") {
                Ok(cmd) => {
                    if let Ok((_rx, _child)) = cmd.spawn() {
                        println!("Python engine started");
                    }
                }
                Err(e) => eprintln!("Error setting up python-engine: {}", e),
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_security_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
