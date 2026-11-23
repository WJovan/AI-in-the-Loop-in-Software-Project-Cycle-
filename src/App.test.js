import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Window } from 'happy-dom';
import { createServer } from 'vite';
import { createProject } from './logic.js';

test('agreement requires both members to answer every perspective', async (t) => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom' });
  t.after(() => server.close());
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const window = new Window({ url: 'http://localhost' });
  const globals = { window, document: window.document, localStorage: window.localStorage, IS_REACT_ACT_ENVIRONMENT: true };
  const saved = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const root = createRoot(window.document.body);
  t.after(async () => {
    await act(() => root.unmount());
    await window.happyDOM.close();
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  for (const missingMember of [0, 1, null]) {
    for (const entry of ['Create agreement', 'Agreement']) {
      await t.test(`${entry}: ${missingMember === null ? 'both complete' : `member ${missingMember + 1} incomplete`}`, async () => {
        const p = createProject();
        p.preferences = p.members.map(() => Object.fromEntries(p.activities.map(a => [a.id, { category: 'allowed' }])));
        if (missingMember !== null) delete p.preferences[missingMember].report;
        window.localStorage.setItem('group09-ai-boundary-board-v1', JSON.stringify(p));
        await act(() => root.render(React.createElement(App, { key: `${missingMember}-${entry}` })));
        const navButton = (name) => [...window.document.querySelectorAll('nav button')].find(b => b.querySelector('strong').textContent === name);
        await act(() => navButton('Compare').click());
        const heading = () => window.document.querySelector('h2').textContent;
        assert.equal(heading(), 'See where you stand');
        const button = entry === 'Agreement' ? navButton(entry) : [...window.document.querySelectorAll('button')].find(b => b.textContent.trim() === entry);
        assert.ok(button);
        assert.equal(button.disabled, missingMember !== null);
        await act(() => button.click());
        assert.equal(heading(), missingMember === null ? 'Make it official' : 'See where you stand');
      });
    }
  }
});
