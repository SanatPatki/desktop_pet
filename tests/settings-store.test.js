import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSettings, normalizeState, saveSettings } from '../src/main/settings-store.js';

test('normalizeState accepts known characters and rejects unknown values', () => {
  assert.deepEqual(normalizeState({ character: 'phoenix' }), { character: 'phoenix' });
  assert.deepEqual(normalizeState({ character: 'unicorn' }), { character: 'dragon' });
  assert.deepEqual(normalizeState(null), { character: 'dragon' });
});

test('settings round-trip through a file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'desktop-pet-'));
  const filePath = join(directory, 'settings.json');

  try {
    saveSettings(filePath, { character: 'phoenix' });
    assert.deepEqual(loadSettings(filePath), { character: 'phoenix' });
    assert.match(await readFile(filePath, 'utf8'), /"character": "phoenix"/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
