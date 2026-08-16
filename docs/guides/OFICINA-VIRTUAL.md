# Oficina virtual: qué cambia y qué no

Caso de referencia de este repositorio: **SpA de desarrollo de software, un accionista con el 100 %,
sin trabajadores, oficina virtual, capital inicial moderado**. Es la estructura más común entre
quienes formalizan por primera vez y la peor modelada por las herramientas contables, que suelen
suponer varios socios, oficina física y planilla.

## La confusión que hay que deshacer

```
Domicilio tributario  ≠  Capital  ≠  CPT  ≠  Patente municipal
```

Una oficina virtual es un **contrato de domicilio comercial**. Sirve para:

- acreditar domicilio ante el SII en el inicio de actividades;
- determinar cuál es la **municipalidad competente** para la patente.

No sirve para nada más. En particular:

- **No es capital.** Contratarla no aporta un peso a la sociedad.
- **No hace que el capital sea cero.** El capital sigue siendo el que se enteró.
- **No hace que la patente sea cero.** La base de la patente es el capital propio, no los metros
  cuadrados. Con capital pequeño la patente no baja indefinidamente: choca contra el **mínimo de
  1 UTM** del art. 24 del D.L. 3.063.

Por eso el modelo de datos las mantiene separadas: `domicilio`, `tipoDomicilio`, `contratoDomicilio`,
`municipalidad`, `comuna` por un lado; `capitalProfile`, `taxEquity`, `municipalPatent` por otro.
Cambiar de domicilio cambia lo primero, nunca lo segundo.

## Tipos de domicilio que la aplicación modela

| Tipo | Qué es | Evidencia típica |
|---|---|---|
| `virtual` | Oficina virtual contratada a un tercero | Contrato de oficina virtual + autorización de uso |
| `propia` | Inmueble del accionista o de la sociedad | Escritura o autorización del propietario |
| `arrendada` | Oficina arrendada | Contrato de arriendo |
| `coworking` | Espacio compartido | Contrato de membresía con derecho a domicilio |

El paso `address` de la lista de constitución (`FORMATION_STEPS`) exige evidencia para poder marcarse
como realizado, igual que cualquier otro trámite ante un organismo externo.

## Qué preguntar a la municipalidad antes de dar por hecho nada

La normativa municipal y los requisitos de patente **varían por comuna**, y hay materias donde la
respuesta depende de antecedentes propios. La aplicación no las resuelve sola; muestra
*“requiere verificación con fuente oficial / municipalidad / profesional tributario”*. Lo que
conviene preguntar:

1. ¿Acepta esa municipalidad una oficina virtual como domicilio para otorgar patente comercial?
2. ¿Cuál es la **tasa** de patente vigente en la comuna, dentro del rango legal de 2,5‰ a 5‰?
   (registrarla en la aplicación con su fuente y fecha, para que deje de estar `UNVERIFIED`);
3. ¿Qué documentos exige (contrato de domicilio, autorización del titular, informe de zonificación)?
4. ¿Hay patente **provisoria** aplicable mientras se completan requisitos?
5. Fechas de declaración y de pago de las cuotas.

## Un accionista, cero trabajadores

Lo que **no** cambia: la determinación del capital propio y el cálculo de la patente son los mismos
que para cualquier contribuyente.

Lo que **sí** cambia:

- **No hay prorrateo entre sucursales.** El art. 25 reparte el capital propio entre unidades según el
  número de trabajadores de cada una; con una sola unidad no aplica.
- **Los retiros son la vía normal de sacar dinero**, y tienen efecto patrimonial: reducen el
  patrimonio y el CPT, **no** el resultado. No son gasto deducible.
- **Los depósitos del dueño exigen decidir su naturaleza.** Aporte, préstamo o ingreso operacional.
  La aplicación lo pregunta en vez de suponer que todo es capital.

## Cómo se ve en la aplicación

En **Empresa → Capital y patrimonio**, el caso de referencia del SANDBOX muestra las seis magnitudes
una al lado de la otra para una SpA unipersonal con oficina virtual, y el simulador permite ver qué
cambia con capitales iniciales de $500.000, $1.000.000 y $5.000.000 — incluido el hecho de que con
los tres la patente inicial acaba en el mínimo legal.

Ver también [patente municipal](../municipal/PATENTE-MUNICIPAL.md),
[capital y patrimonio](../accounting/CAPITAL-PATRIMONIO.md) y el
[glosario](../GLOSSARY.md#oficina-virtual).
