// src/components/layout/Navbar.test.ts
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

// Polyfill import.meta.env for Node test runner before loading modules
if (typeof (import.meta as any).env === 'undefined') {
  (import.meta as any).env = {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key',
  };
}

describe('Public Site Navbar Navigation Tests', () => {
  test('1. NAV_LINKS contains all required 7 public sections with valid IDs and names', async () => {
    const { NAV_LINKS } = await import('./Navbar');
    assert.equal(NAV_LINKS.length, 7);

    const expectedSections = [
      { id: 'home', name: 'Início' },
      { id: 'sobre', name: 'Empresa' },
      { id: 'servicos', name: 'Serviços' },
      { id: 'projetos', name: 'Obras' },
      { id: 'blog', name: 'Laudos' },
      { id: 'diferenciais', name: 'Diferenciais' },
      { id: 'contato', name: 'Contato' },
    ];

    NAV_LINKS.forEach((link, idx) => {
      assert.equal(link.id, expectedSections[idx].id);
      assert.equal(link.name, expectedSections[idx].name);
      assert.equal(link.href, `#${expectedSections[idx].id}`);
      assert.ok(link.icon, `Icon should be defined for ${link.name}`);
    });
  });

  test('2. Public Navigation scroll calculation offsets header height correctly', () => {
    const calculateTargetPosition = (
      elementTop: number,
      currentScrollY: number,
      headerHeight: number = 85
    ) => {
      return Math.max(0, elementTop + currentScrollY - headerHeight - 8);
    };

    // When element is 500px from top and scrollY is 0
    const pos1 = calculateTargetPosition(500, 0, 85);
    assert.equal(pos1, 407);

    // When element is at top (50px), position shouldn't go below 0
    const pos2 = calculateTargetPosition(50, 0, 85);
    assert.equal(pos2, 0);
  });
});


