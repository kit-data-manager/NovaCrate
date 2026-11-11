//! NovaCrate desktop app: native backend and Tauri shell around the Next.js
//! editor. See `README.md` for how to run it.

mod commands;
mod fsops;
mod session;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(session::AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::open_crate,
            commands::close_crate,
            commands::read_file,
            commands::write_file,
            commands::create_folder,
            commands::list_crate_contents,
            commands::get_crate_file_info,
            commands::move_crate_entry,
            commands::delete_crate_entry,
            commands::get_crate_quota,
            commands::export_crate,
            commands::crate_exists,
            commands::create_crate_from_zip_bytes,
            commands::create_crate_from_metadata,
            commands::delete_crate_file,
            commands::repository_quota
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
