import test from 'node:test';
import assert from 'node:assert/strict';

import { INTERACTIVE, MAGNETIC, MAGNET_MAX, TEXT_ENTRY, cursorTarget, magnetOffset, shouldEnable } from './cursor.mjs';

/** Un elemento de mentira: `closest` responde según lo que diga cada caso. */
function element({ text = false, label = '', link = false, button = false, disabled = false } = {}) {
  return {
    closest(selector) {
      if (selector === TEXT_ENTRY) return text ? {} : null;
      if (selector === MAGNETIC) return button ? {} : null;
      if (selector === '[data-cursor]') return label ? { dataset: { cursor: label } } : null;
      if (selector === INTERACTIVE) return link || label ? { disabled, getAttribute: () => null } : null;
      return null;
    },
  };
}

test('en los campos de texto se aparta y deja el cursor del sistema', () => {
  assert.deepEqual(cursorTarget(element({ text: true, link: true })), { mode: 'text' });
});

test('con una acción escrita se vuelve disco con su texto', () => {
  assert.deepEqual(cursorTarget(element({ label: 'Llamar' })), { mode: 'label', label: 'Llamar' });
});

test('sobre un botón se funde con él', () => {
  assert.deepEqual(cursorTarget(element({ button: true, link: true })), { mode: 'button' });
});

test('sobre lo que se puede tocar se abre, y sobre un botón desactivado no', () => {
  assert.deepEqual(cursorTarget(element({ link: true })), { mode: 'link' });
  assert.deepEqual(cursorTarget(element({ link: true, disabled: true })), { mode: 'idle' });
  assert.deepEqual(cursorTarget(element()), { mode: 'idle' });
  assert.deepEqual(cursorTarget(null), { mode: 'idle' });
});

test('viene encendido, salvo en pantallas táctiles, con movimiento reducido o si se apagó', () => {
  assert.equal(shouldEnable({ fine: true, reduced: false, pref: null }), true);
  assert.equal(shouldEnable({ fine: true, reduced: false, pref: '1' }), true);
  assert.equal(shouldEnable({ fine: true, reduced: false, pref: '0' }), false);
  assert.equal(shouldEnable({ fine: false, reduced: false, pref: '1' }), false);
  assert.equal(shouldEnable({ fine: true, reduced: true, pref: '1' }), false);
});

test('el imán de los botones es sutil y nunca pasa de su tope', () => {
  assert.deepEqual(magnetOffset(0, 0), { x: 0, y: 0 });
  const near = magnetOffset(10, -10);
  assert.ok(near.x > 0 && near.y < 0 && Math.abs(near.x) < 3);
  const far = magnetOffset(400, -400);
  assert.equal(far.x, MAGNET_MAX);
  assert.equal(far.y, -MAGNET_MAX);
});
