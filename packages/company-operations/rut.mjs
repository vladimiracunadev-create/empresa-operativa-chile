/**
 * RUT chileno: normalización y dígito verificador (módulo 11).
 *
 * Se valida de verdad en vez de aceptar cualquier texto porque un RUT mal
 * tipeado no falla el día que se escribe: se propaga a documentos,
 * declaraciones y conciliaciones, y reaparece meses después como un descuadre
 * cuyo origen ya nadie recuerda.
 */

/** Quita puntos, espacios y normaliza la K. */
export const cleanRut = input => String(input || '').replace(/[.\s]/g, '').toUpperCase();

/** Dígito verificador que corresponde a un cuerpo numérico. */
export function rutCheckDigit(body) {
  const digits = String(body).replace(/\D/g, '');
  if (!digits) throw new Error('El cuerpo del RUT debe tener dígitos');
  let sum = 0;
  let factor = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += Number(digits[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return '0';
  if (rest === 10) return 'K';
  return String(rest);
}

/**
 * Valida un RUT completo.
 * @returns {{valid:true, formatted:string, body:string, dv:string}|{valid:false, reason:string}}
 */
export function validateRut(input) {
  const clean = cleanRut(input);
  const match = /^(\d{7,8})-?([\dK])$/.exec(clean);
  if (!match) return { valid: false, reason: 'Formato esperado: 76.123.456-7' };
  const [, body, dv] = match;
  const expected = rutCheckDigit(body);
  if (expected !== dv) {
    return { valid: false, reason: `Dígito verificador incorrecto (debería terminar en ${expected})` };
  }
  return { valid: true, body, dv, formatted: `${Number(body).toLocaleString('es-CL')}-${dv}` };
}
