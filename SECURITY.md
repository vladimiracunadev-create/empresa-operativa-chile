# Seguridad y privacidad

## Modelo de amenazas de este proyecto

No es una aplicación con servidor, cuentas ni datos de terceros. Los riesgos reales son otros
tres, en este orden:

1. **Subir contabilidad real al repositorio.** Es el más probable y el más caro: expone RUT de
   terceros, montos, folios y relaciones comerciales, y queda en el historial de Git para siempre.
2. **Publicar un artefacto que calcula mal.** Un APK con una tasa vieja no falla: da números
   plausibles que aparecen meses después como una diferencia con el SII.
3. **Perder los datos.** No hay servidor que respalde por ti. Desinstalar la app o borrar los
   datos del navegador sin exportar es una pérdida definitiva.

## Nunca subas al repositorio

- Clave Tributaria del SII.
- Certificado digital o clave privada (`.pfx`, `.p12`, `.pem`, `.key`, `.jks`, `.keystore`).
- Respaldos exportados desde **EMPRESA REAL** (`empresa-operativa-*.json`).
- Cartolas bancarias.
- DTE reales con datos de terceros.
- Declaraciones descargadas del SII sin sanitizar.
- Tokens o claves de API.

El workflow [`security.yml`](.github/workflows/security.yml) busca todo esto en cada push y en
cada pull request, y falla si lo encuentra. `.gitignore` cubre además `.local-data/`,
`private-data/` y los archivos que la aplicación exporta.

Para datos de prueba usa [`data/scenarios/`](data/scenarios/) o el entorno **SANDBOX** de la app.

## Qué garantiza la aplicación

| Garantía | Cómo está implementada |
| --- | --- |
| No hay telemetría | Ninguna llamada de red en `apps/web/`; CSP `default-src 'self'` |
| Los datos no salen del dispositivo | `localStorage` + archivos locales en Windows |
| Cero dependencias de producción | Verificado en CI en cada push |
| El servidor local no queda expuesto a la red | Escucha en `127.0.0.1`, no en `0.0.0.0` |
| La app de Windows no puede escribir donde quiera | Sólo `core:default`; cuatro comandos que validan sus argumentos |
| El espejo en disco no se corrompe a medias | Escritura atómica: temporal + `rename` |
| El texto del usuario no puede inyectar marcado | Plantilla `html` que escapa por defecto |

## Qué NO garantiza

Con la misma claridad:

- **Los datos no están cifrados.** Ni en `localStorage` ni en el espejo de Windows. Quien tenga
  acceso al dispositivo desbloqueado tiene acceso a la contabilidad.
- **Los binarios no están firmados** con certificado de código. Windows SmartScreen y Android
  mostrarán un aviso. Verifica el `SHA256SUMS.txt` del release.
- **El APK es de depuración**, firmado con la clave de debug de Android.
- **No hay autenticación local.** La aplicación no pide PIN ni contraseña.
- **Los respaldos no están cifrados.** Un respaldo exportado es un JSON legible.

Están en el roadmap y documentados en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Respalda

La contrapartida de que no haya servidor es que el respaldo es tuyo. Exporta desde la pestaña
**Datos** cada vez que cierres un período, y guarda el archivo fuera del dispositivo.

## Reportar una vulnerabilidad

Abre un [Security Advisory privado](https://github.com/vladimiracunadev-create/empresa-operativa-chile/security/advisories/new)
en lugar de una incidencia pública.

Incluye qué encontraste, cómo reproducirlo y qué impacto tendría. Respuesta en un plazo
razonable; este es un proyecto mantenido por una persona.

## Fuera de alcance

- Que los binarios no estén firmados (conocido y documentado).
- Que los datos locales no estén cifrados (conocido y documentado).
- Que el borrador F29 no cubra todos los códigos del formulario: es una limitación declarada
  del producto, no un fallo de seguridad.
