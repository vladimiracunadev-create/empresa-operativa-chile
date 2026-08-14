// Sin consola en Windows en release: la app abre su ventana, no una terminal.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    empresa_operativa_chile_lib::run();
}
