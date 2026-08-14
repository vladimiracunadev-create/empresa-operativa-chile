import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRut, rutCheckDigit, cleanRut } from '../packages/company-operations/rut.mjs';

test('acepta RUT válidos escritos de varias formas', () => {
  for (const input of ['76.000.000-0', '76000000-0', '760000000', ' 76.000.000-0 ']) {
    assert.equal(validateRut(input).valid, true, `rechazó ${input}`);
  }
});

test('formatea con puntos y guion', () => {
  assert.equal(validateRut('760000000').formatted, '76.000.000-0');
});

test('rechaza un dígito verificador incorrecto y explica cuál era', () => {
  const r = validateRut('76.000.000-1');
  assert.equal(r.valid, false);
  assert.match(r.reason, /debería terminar en 0/);
});

test('reconoce el dígito verificador K', () => {
  // 12.345.670-K: el módulo 11 da resto 10, que se representa como K.
  const dv = rutCheckDigit('12345670');
  assert.equal(dv, 'K');
  assert.equal(validateRut(`12345670-${dv}`).valid, true);
  assert.equal(validateRut('12345670-k').valid, true, 'la K minúscula debería aceptarse');
});

test('rechaza basura sin lanzar excepciones', () => {
  for (const input of ['', null, undefined, 'no soy un rut', '1-9', '999999999999-9', '76.000.000-Z']) {
    const r = validateRut(input);
    assert.equal(r.valid, false, `aceptó ${JSON.stringify(input)}`);
    assert.ok(r.reason);
  }
});

test('cleanRut normaliza sin validar', () => {
  assert.equal(cleanRut(' 12.345.670-k '), '12345670-K');
});
