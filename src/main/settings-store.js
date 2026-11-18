import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const DEFAULT_STATE = { character: 'dragon' };
const VALID_CHARACTERS = new Set(['dragon', 'phoenix']);

export function normalizeState(value) {
  const character = VALID_CHARACTERS.has(value?.character) ? value.character : DEFAULT_STATE.character;
  return { character };
}

export function loadSettings(filePath) {
  try {
    return normalizeState(JSON.parse(readFileSync(filePath, 'utf8')));
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveSettings(filePath, state) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(normalizeState(state), null, 2)}\n`, 'utf8');
}
