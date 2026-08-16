# 🔗 Fuentes oficiales verificadas — Chile 2026

Última revisión del repositorio: **16 de agosto de 2026**
(capital propio tributario, patente municipal y reglas societarias; el resto, 9 de agosto de 2026).

> Las normas cambian. Antes de usar una tasa o plazo en una declaración real, vuelve a comprobar la fuente oficial.

## SII

- Regímenes tributarios / Pro Pyme General: https://www.sii.cl/destacados/modernizacion/tipos_regimenes_mt.html
- Requisitos Pro Pyme General (actualizado 15-04-2026): https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_7530.htm
- Tasas de Impuesto de Primera Categoría: https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_4708.htm
- Declaración mensual F29: https://www.sii.cl/servicios_online/1042-3264.html
- Plazos F29: https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_1060.htm
- Sistema de facturación gratuito: https://www.sii.cl/servicios_online/1039-1183.html
- Registro de Compras y Ventas: https://www.sii.cl/preguntas_frecuentes/factura_electronica/arbol_factura_electronica_1483.htm
- RCV reemplaza libro de compras y ventas: https://www.sii.cl/preguntas_frecuentes/factura_electronica/001_003_6979.htm
- IVA servicios: https://www.sii.cl/destacados/iva_prestacion_servicios/
- Boletas de honorarios 2026 / retención 15,25%: https://www.sii.cl/destacados/boletas_honorarios/
- UTM 2026: https://www.sii.cl/valores_y_fechas/utm/utm2026.htm
- Operación Renta 2026 / regímenes: https://www.sii.cl/destacados/renta/2026/intermediarios/regimenes_tributarios/
- Ejercicios prácticos de Renta 2026: https://www.sii.cl/servicios_online/renta/2026/ejercicios.html
- Instrucciones F22 / Guía Renta 2026: https://www.sii.cl/servicios_online/renta/guia_trib_suplemento_2026.html
- Declaraciones Juradas AT 2026: https://www.sii.cl/ayudas/ayudas_por_servicios/2120-formularios_y_plazos_2026-2171.html

## Capital propio tributario (verificado 16-08-2026)

- LIR art. 41 N.º 1 — definición del CPT (activo − pasivo exigible, rebajados los valores intangibles,
  nominales, transitorios y de orden que no representen inversiones efectivas):
  https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_7347.htm
- LIR art. 14 letra D) N.º 3 letra (j) — CPT simplificado del régimen Pro Pyme.
  Circular SII N.º 62 de 2020: https://www.sii.cl/normativa_legislacion/circulares/2020/circu62.pdf
- Circular SII N.º 73 de 2020: https://www.sii.cl/normativa_legislacion/circulares/2020/circu73.pdf
- Oficio SII N.º 1.700 de 15-06-2016 — relación entre el art. 41 de la LIR y el art. 24 del D.L. 3.063.
  Cita literalmente el inciso tercero del art. 24:
  https://www.sii.cl/pagina/jurisprudencia/adminis/2016/renta/ja1700.htm

## Legislación / BCN

- D.L. N.º 3.063 de 1979 sobre Rentas Municipales (patentes), arts. 23 a 26:
  https://www.bcn.cl/leychile/navegar?idNorma=6942

> **Nota de verificación (16-08-2026).** BCN/LeyChile no respondió a las consultas automatizadas ese
> día. El articulado del art. 24 y del art. 25 se contrastó contra el Oficio SII N.º 1.700 de 2016,
> que lo cita literalmente, y contra una reproducción pública del texto. El repositorio citaba dos
> `idNorma` distintos (6942 y 7054) para la misma norma; se unificó en 6942, que es el que ya venía
> embebido en las reglas. **Reverificar el enlace en BCN antes de usar estas cifras en una
> declaración real.**

## Datos fijados en la regla 2026

| Dato | Valor | Observación |
|---|---:|---|
| IVA general | 19% | Regla general; revisar exenciones |
| Retención honorarios 2026 | 15,25% | Vigente desde 01-01-2026 |
| PPM Pro Pyme año inicio | 0,25% | Regla base vigente |
| IDPC Pro Pyme comercial 2026 | 12,5% | Reducción transitoria; revalidar para OR 2027 |
| UTM agosto 2026 | $71.649 | Sólo referencia del mes |
| Patente municipal — tasa | 2,5‰–5‰ | Rango legal; cada comuna fija la suya por ordenanza |
| Patente municipal — mínimo | 1 UTM | Art. 24 D.L. 3.063 |
| Patente municipal — máximo | **8.000 UTM** | Art. 24 D.L. 3.063. **Corregido el 16-08-2026**: el repositorio traía 4.000 UTM, que es el texto anterior a la Ley N.º 20.280 |
| Base patente — empresa nueva | Capital propio inicial declarado | Art. 24 inciso 3.º |
| Base patente — ejercicios posteriores | Capital propio del balance al 31-12 anterior, ajustado por arts. 41 y ss. LIR | Art. 24 inciso 3.º |
| Información SII → municipalidades | Mes de mayo de cada año | Art. 24 |
| Prorrateo entre sucursales | Según número de trabajadores por unidad | Art. 25 |

### Tasas municipales por comuna

**No están en este repositorio, y es deliberado.** No existe una tasa nacional: cada municipalidad
elige la suya dentro del rango legal. `packages/chile-tax-rules/municipalities.mjs` trae identidad de
comunas sin tasas, todas con `status: "UNVERIFIED"`. El usuario registra la de su comuna con su
fuente y su fecha, y sólo entonces deja de mostrarse la advertencia de simulación.

## Jerarquía de confianza usada

1. Ley vigente / BCN.
2. SII: normativa, circulares, resoluciones.
3. SII: preguntas frecuentes y guías operativas.
4. El repositorio: interpretación educativa y simulación.

Cuando exista diferencia entre el simulador y SII, **manda la fuente oficial y la situación tributaria real del contribuyente**.
