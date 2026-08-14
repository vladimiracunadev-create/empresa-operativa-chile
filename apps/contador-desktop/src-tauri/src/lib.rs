//! Shell de escritorio para Windows.
//!
//! La interfaz es exactamente la misma aplicación web que corre en el navegador
//! y dentro del APK (`apps/web/dist`), embebida en el ejecutable. Este proceso
//! de Rust aporta lo único que una WebView no puede dar por sí sola: archivos
//! de verdad en el disco del usuario.
//!
//! Modelo de datos: la WebView sigue guardando en `localStorage` —es síncrono,
//! y el motor contable no es asíncrono— y aquí se mantiene un ESPEJO en JSON.
//! Al arrancar, el espejo repone lo que falte; en cada escritura, se actualiza.
//! Así los datos son ficheros que el usuario puede copiar, respaldar y ver, sin
//! partir el motor en dos implementaciones.

use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

/// Modos válidos. Se valida en vez de interpolar lo que llegue de la WebView:
/// `mode` termina siendo un nombre de archivo, y aceptar `../algo` sería una
/// escritura arbitraria en el disco.
fn safe_mode(mode: &str) -> Result<&'static str, String> {
    match mode {
        "real" => Ok("real"),
        "sandbox" => Ok("sandbox"),
        other => Err(format!("modo desconocido: {other}")),
    }
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn workspace_file(app: &AppHandle, mode: &str) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join(format!("{}.json", safe_mode(mode)?)))
}

/// Lee el espejo de un entorno. Devuelve `None` la primera vez.
#[tauri::command]
fn load_workspace(app: AppHandle, mode: String) -> Result<Option<String>, String> {
    let file = workspace_file(&app, &mode)?;
    if !file.exists() {
        return Ok(None);
    }
    fs::read_to_string(&file).map(Some).map_err(|e| e.to_string())
}

/// Escribe el espejo de un entorno.
///
/// Escritura atómica: primero a un temporal y después `rename`. Un corte de luz
/// a mitad de un `write` deja el archivo anterior intacto en vez de un JSON
/// truncado que no abre.
#[tauri::command]
fn save_workspace(app: AppHandle, mode: String, payload: String) -> Result<(), String> {
    // Se valida que sea JSON antes de tocar el disco: si la WebView manda algo
    // corrupto, mejor fallar aquí que pisar un espejo bueno con basura.
    serde_json::from_str::<serde_json::Value>(&payload).map_err(|e| format!("payload inválido: {e}"))?;

    let file = workspace_file(&app, &mode)?;
    let tmp = file.with_extension("json.tmp");
    fs::write(&tmp, payload).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &file).map_err(|e| e.to_string())?;
    Ok(())
}

/// Guarda un archivo exportado en `Documentos/Empresa Operativa Chile`.
///
/// Sin diálogo nativo a propósito: una carpeta fija y predecible evita una
/// dependencia más y hace que los respaldos terminen siempre en el mismo sitio,
/// que es justamente lo que se quiere de un respaldo.
#[tauri::command]
fn export_file(app: AppHandle, filename: String, contents: String) -> Result<String, String> {
    // El nombre viene de la WebView: se acepta sólo el componente final, sin
    // separadores ni `..`.
    let name = PathBuf::from(&filename);
    let name = name
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "nombre de archivo inválido".to_string())?;
    if name.is_empty() || name.starts_with('.') {
        return Err("nombre de archivo inválido".into());
    }

    let dir = app
        .path()
        .document_dir()
        .unwrap_or(data_dir(&app)?)
        .join("Empresa Operativa Chile");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let dest = dir.join(name);
    fs::write(&dest, contents).map_err(|e| e.to_string())?;
    Ok(dest.to_string_lossy().to_string())
}

/// Datos para la pestaña "Datos": versión y dónde viven los archivos.
#[tauri::command]
fn app_info(app: AppHandle) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "version": app.package_info().version.to_string(),
        "dataDir": data_dir(&app)?.to_string_lossy(),
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_workspace,
            save_workspace,
            export_file,
            app_info
        ])
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar Empresa Operativa Chile");
}

#[cfg(test)]
mod tests {
    use super::safe_mode;

    #[test]
    fn solo_se_aceptan_los_dos_modos() {
        assert_eq!(safe_mode("real").unwrap(), "real");
        assert_eq!(safe_mode("sandbox").unwrap(), "sandbox");
    }

    #[test]
    fn un_modo_con_ruta_se_rechaza() {
        // Sin esta validación, `mode` acabaría concatenado en una ruta de disco.
        assert!(safe_mode("../../etc/passwd").is_err());
        assert!(safe_mode("real/../otro").is_err());
        assert!(safe_mode("").is_err());
    }
}
