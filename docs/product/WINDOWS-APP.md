# 💻 Aplicación de Windows

## Arquitectura actual

- **Tauri 2** como shell nativo (WebView2).
- **Interfaz:** exactamente `apps/web/dist`, la misma que el navegador y el APK.
- **Rust:** cuatro comandos, todos con validación de argumentos
  (`load_workspace`, `save_workspace`, `export_file`, `app_info`).
- **Instaladores:** MSI (WiX), NSIS y ejecutable portable.

## Por qué no hay SQLite

La versión anterior planteaba una base SQLite por entorno, gestionada desde Rust. Se descartó
por una razón concreta: obligaba a mantener **dos implementaciones del motor contable** —una en
JavaScript para la web y Android, otra en Rust para Windows— que inevitablemente se separan.
Un cálculo de IVA que difiere entre plataformas es un fallo peor que cualquier ventaja de tener
una base embebida.

El modelo actual es un único motor en JavaScript y un **espejo en disco**:

```text
WebView (localStorage)  ←— fuente que lee la UI, síncrona
        │
        │  cada escritura
        ▼
Rust → %APPDATA%/…/real.json   (escritura atómica: temporal + rename)
       %APPDATA%/…/sandbox.json
```

Al arrancar, el espejo repone únicamente las claves que falten en `localStorage`: si la WebView
ya tiene el dato, gana el dato vivo. Así un espejo antiguo no puede pisar una sesión en curso
por una carrera durante el arranque.

Lo que se gana con esto: los datos siguen siendo **archivos reales** que el usuario puede copiar,
respaldar y abrir, sin partir el motor en dos.

## Separación real / sandbox

Cada entorno tiene su propio archivo y su propio prefijo en `localStorage`. El parámetro `mode`
que llega desde la WebView se valida contra una lista cerrada antes de tocar el disco: sin esa
validación acabaría concatenado en una ruta, y `../algo` sería una escritura arbitraria.

## Permisos

La ventana declara únicamente `core:default`. La aplicación no usa red, ni shell, ni el plugin
genérico de sistema de archivos: todo el acceso a disco pasa por los cuatro comandos anteriores.

La CSP prohíbe cualquier origen externo (`default-src 'self'`).

## Verificación en CI

Tauri comprime los recursos dentro del binario, así que después no se pueden contar leyendo el
`.exe`. Por eso el workflow verifica en dos momentos:

1. **Antes de empaquetar:** que `apps/web/dist` tenga las 10 vistas, los 6 módulos del núcleo y
   el índice correcto.
2. **Después de compilar:** que los tres artefactos existan, superen un tamaño mínimo y que el
   ejecutable portable **arranque y siga vivo** pasados 12 segundos.

## Endurecimientos pendientes antes de un uso crítico

- firma de código de los instaladores (hoy SmartScreen avisa);
- cifrado del espejo en disco y de los respaldos;
- PIN local o Windows Hello opcional;
- actualizador firmado;
- importación de RCV/DTE/cartolas;
- recuperación asistida ante corrupción del espejo.
