// Prevents an additional console window on Windows in release, and thus
// improves performance.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    novacrate_desktop::run()
}
