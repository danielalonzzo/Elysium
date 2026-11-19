/**
 * Edad en «años humanos» y etapa de vida, aproximadas.
 *
 * Primer año ≈ 15, segundo ≈ 24 y después un tanto fijo por año que en perros
 * crece con el tamaño (tabla difundida por la AVMA) y en gatos es 4 (tabla de
 * las guías felinas AAHA/AAFP 2021). Las etapas siguen esas mismas guías,
 * simplificadas a cuatro. Es una orientación divertida, no un dato clínico.
 */
const PER_YEAR = {small: 4, medium: 4.5, large: 5.25};

export function humanAge(species, age, size = 'medium') {
  if (age <= 1) return 15 * age;
  if (age <= 2) return 15 + 9 * (age - 1);
  const k = species === 'cat' ? 4 : PER_YEAR[size] ?? PER_YEAR.medium;
  return 24 + k * (age - 2);
}

export const STAGES = {
  dog: [{id: 'baby', from: 0}, {id: 'young', from: 1}, {id: 'adult', from: 3}, {id: 'senior', from: 7}],
  dogLarge: [{id: 'baby', from: 0}, {id: 'young', from: 1}, {id: 'adult', from: 3}, {id: 'senior', from: 6}],
  cat: [{id: 'baby', from: 0}, {id: 'young', from: 1}, {id: 'adult', from: 7}, {id: 'senior', from: 11}],
};

export function lifeStage(species, age, size = 'medium') {
  const list = STAGES[species === 'dog' && size === 'large' ? 'dogLarge' : species];
  return [...list].reverse().find(s => age >= s.from).id;
}
