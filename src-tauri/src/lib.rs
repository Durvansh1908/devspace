// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri_plugin_shell::ShellExt;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Returns the OS platform DevSpace is running on, so the frontend
// can adapt terminal commands (e.g. `ls` vs `dir`) and UI hints.
#[tauri::command]
fn get_platform() -> String {
    #[cfg(target_os = "windows")]
    return "windows".to_string();
    #[cfg(target_os = "macos")]
    return "macos".to_string();
    #[cfg(target_os = "linux")]
    return "linux".to_string();
}

// Runs a shell command in the given working directory and returns
// stdout/stderr. Used by the in-app terminal. Scoped to the project
// folder the frontend passes in — never runs arbitrary paths blindly.
#[tauri::command]
async fn run_terminal_command(
    app: tauri::AppHandle,
    command: String,
    cwd: String,
) -> Result<String, String> {
    let shell = app.shell();

    let (shell_bin, shell_arg) = if cfg!(target_os = "windows") {
        ("powershell", "-Command")
    } else {
        ("sh", "-c")
    };

    let output = shell
        .command(shell_bin)
        .args([shell_arg, &command])
        .current_dir(cwd)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() && !stderr.is_empty() {
        return Err(stderr);
    }

    Ok(if stdout.is_empty() { stderr } else { stdout })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_platform,
            run_terminal_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}