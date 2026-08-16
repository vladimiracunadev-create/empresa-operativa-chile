// GENERADO POR scripts/build-rules.mjs — NO EDITAR A MANO.
// Fuente de verdad: packages/chile-tax-rules/rules/<año>.json
// Regenerar con: node scripts/build-rules.mjs

export const RULES = {
  2026: {
    "schemaVersion": 2,
    "country": "CL",
    "commercialYear": 2026,
    "lastVerified": "2026-08-09",
    "profile": "SpA Pro Pyme General — línea base operativa y educativa",
    "status": "baseline",
    "iva": {
      "generalRate": 0.19,
      "source": "https://www.sii.cl/valores_y_fechas/iva/iva2026.htm",
      "lastVerified": "2026-08-09",
      "note": "Tasa general del IVA. No modela exenciones, proporcionalidad ni regímenes especiales."
    },
    "honorarios": {
      "retentionRate": 0.1525,
      "source": "https://www.sii.cl/preguntas_frecuentes/renta/001_002_5310.htm",
      "lastVerified": "2026-08-09",
      "note": "Retención sobre boletas de honorarios según la gradualidad de la Ley 21.133."
    },
    "ppmProPyme": {
      "initialYearRate": 0.0025,
      "upTo50000UfRate": 0.0025,
      "above50000UfRate": 0.005,
      "source": "https://www.sii.cl/destacados/modernizacion/regimenes_mt.html",
      "lastVerified": "2026-08-09",
      "note": "PPM del régimen Pro Pyme General. La tasa efectiva puede variar por recálculos y créditos."
    },
    "idpcProPyme": {
      "rate": 0.125,
      "source": "https://www.sii.cl/destacados/modernizacion/regimenes_mt.html",
      "lastVerified": "2026-08-09",
      "note": "Referencia para rentas del año comercial 2026; validar nuevamente antes de Operación Renta 2027."
    },
    "utm": {
      "2026-08": 71649,
      "source": "https://www.sii.cl/valores_y_fechas/utm/utm2026.htm",
      "lastVerified": "2026-08-09",
      "note": "La UTM cambia todos los meses. Actualizar el mes correspondiente antes de calcular patentes o multas."
    },
    "municipalPatent": {
      "minUtm": 1,
      "maxUtm": 8000,
      "minRate": 0.0025,
      "maxRate": 0.005,
      "source": "https://www.bcn.cl/leychile/navegar?idNorma=6942",
      "legalReference": "D.L. N.º 3.063 de 1979 sobre Rentas Municipales, art. 24",
      "effectiveFrom": "2008-07-04",
      "lastVerified": "2026-08-16",
      "verificationNote": "El texto del art. 24 se contrastó contra el Oficio SII N.º 1.700 de 15-06-2016, que cita literalmente su inciso tercero, y contra una reproducción pública del articulado. BCN/LeyChile no respondió el 16-08-2026; reverificar el enlace antes de usar la cifra en una declaración real.",
      "note": "Rango legal. Cada municipalidad fija su tasa dentro del rango mediante ordenanza; la tasa concreta de una comuna NO está en este archivo y debe verificarse con la municipalidad.",
      "capitalBasis": {
        "newBusiness": {
          "rule": "capital propio inicial declarado por el contribuyente",
          "legalReference": "D.L. 3.063, art. 24 inciso tercero",
          "note": "Para actividades nuevas la base es el capital propio inicial que el contribuyente declara, no cualquier cifra registrada como capital social o suscrito."
        },
        "establishedBusiness": {
          "rule": "capital propio registrado en el balance terminado el 31 de diciembre inmediatamente anterior, con los ajustes de los arts. 41 y siguientes de la LIR",
          "legalReference": "D.L. 3.063, art. 24 inciso tercero; LIR art. 41",
          "note": "Por eso la base del año 2 no tiene por qué coincidir con el capital declarado al constituir la sociedad."
        },
        "simplifiedTaxEquity": {
          "rule": "los contribuyentes que determinan capital propio tributario simplificado se sujetan a esas reglas",
          "legalReference": "D.L. 3.063, art. 24; LIR art. 14 letra D) N.º 3 letra (j)"
        }
      },
      "deductions": {
        "investmentsInOtherPatentedBusinesses": {
          "allowed": true,
          "legalReference": "D.L. 3.063, art. 24 inciso final",
          "evidence": "certificado emitido por la municipalidad correspondiente",
          "note": "Se puede deducir la parte del capital propio invertida en otros negocios afectos al pago de patente, acreditada con certificado municipal."
        }
      },
      "branchAllocation": {
        "method": "prorrateo del capital propio entre las unidades según el número de trabajadores de cada una",
        "declaredIn": "declaración anual del mes de mayo",
        "legalReference": "D.L. 3.063, art. 25",
        "note": "La municipalidad de la casa matriz determina la distribución y la comunica a las demás."
      },
      "informationFlow": {
        "siiToMunicipalities": "El SII pone a disposición de cada municipalidad, dentro del mes de mayo de cada año, el capital propio declarado, el RUT y el código de actividad de sus contribuyentes.",
        "legalReference": "D.L. 3.063, art. 24",
        "note": "Esta aplicación NO está conectada al SII ni a ninguna municipalidad: sólo modela el flujo."
      }
    },
    "taxEquity": {
      "methods": {
        "article41": {
          "id": "article41",
          "label": "CPT del art. 41 N.º 1 de la LIR",
          "formula": "activo tributario − pasivo exigible tributario, rebajados previamente los valores intangibles, nominales, transitorios y de orden que no representen inversiones efectivas",
          "legalReference": "LIR art. 41 N.º 1",
          "source": "https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_7347.htm",
          "lastVerified": "2026-08-16"
        },
        "simplified14D3j": {
          "id": "simplified14D3j",
          "label": "CPT simplificado Pro Pyme",
          "formula": "capital aportado formalizado (+ aumentos) + bases imponibles de primera categoría de cada año + rentas percibidas por participaciones en otras empresas − disminuciones de capital − pérdidas − partidas del inciso segundo del art. 21 pagadas − retiros y distribuciones a los propietarios",
          "floorZero": true,
          "legalReference": "LIR art. 14 letra D) N.º 3 letra (j)",
          "source": "https://www.sii.cl/normativa_legislacion/circulares/2020/circu62.pdf",
          "lastVerified": "2026-08-16",
          "note": "Si el resultado es negativo, el capital propio tributario simplificado se considera $0."
        }
      },
      "eligibility": {
        "simplified14D3j": [
          "Pro Pyme General (14 D N.º 3)"
        ],
        "note": "El régimen Pro Pyme Transparente (14 D N.º 8) y el Régimen General (14 A) NO determinan el CPT simplificado de la letra (j); su tratamiento requiere revisión profesional."
      },
      "initialTaxEquity": {
        "rule": "En el primer ejercicio el capital propio tributario inicial se determina a la fecha de inicio de actividades y corresponde, en lo esencial, al capital efectivamente enterado más los aportes en bienes a su valor tributario, menos los pasivos exigibles existentes a esa fecha.",
        "legalReference": "LIR art. 41 N.º 1",
        "note": "El capital SUSCRITO pero no enterado no es un activo de la empresa; sólo lo enterado ingresa al patrimonio."
      },
      "warnings": [
        "El CPT que esta aplicación calcula es una ESTIMACIÓN interna. El CPT que rige es el que la empresa declara en su F22 y el que el SII acepta.",
        "No se modelan corrección monetaria del art. 41, revalorizaciones, reorganizaciones empresariales, activos en moneda extranjera ni depreciación tributaria acelerada."
      ]
    },
    "f29": {
      "generalDueDay": 12,
      "internetPaidEligibleDueDay": 20,
      "internetNoPaymentDueDay": 28,
      "source": "https://www.sii.cl/preguntas_frecuentes/iva/001_030_1668.htm",
      "lastVerified": "2026-08-09",
      "note": "Si el vencimiento cae en día inhábil, el plazo se traslada según la regla vigente del SII."
    },
    "warnings": [
      "El cálculo F29 es una simulación educativa básica y no reemplaza la propuesta oficial del SII.",
      "La UTM debe actualizarse para el mes que corresponda.",
      "Exenciones, proporcionalidad de IVA, activos fijos, importaciones y reglas especiales requieren módulos adicionales o revisión experta.",
      "Ninguna tasa de este archivo debe tratarse como permanente: cada año comercial exige su propio archivo de reglas verificado contra la fuente oficial.",
      "Este archivo contiene el RANGO legal de la patente municipal, no la tasa de ninguna comuna. La tasa efectiva la fija cada municipalidad por ordenanza y debe verificarse con ella.",
      "Capital social, capital suscrito, capital enterado, patrimonio contable, capital propio tributario y capital base de patente son magnitudes distintas: este archivo no las trata como sinónimos y la aplicación tampoco debe hacerlo."
    ]
  }
};

export const AVAILABLE_YEARS = [2026];

export default RULES;
