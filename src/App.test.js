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
  for (const entry of ['Create agreement', 'Agreement']) {
    await t.test(entry + ' prefills aligned policies and preserves later edits', async () => {
      const p = createProject();
      const categories = ['allowed', 'limited', 'not_allowed', 'allowed'];
      p.preferences = p.members.map((member, index) => Object.fromEntries(p.activities.map((a, i) => [a.id, { category: index === 1 && a.id === 'report' ? 'limited' : categories[i], reason: member + "'s reason" }])));
      window.localStorage.setItem('group09-ai-boundary-board-v1', JSON.stringify(p));
      const nav = name => [...window.document.querySelectorAll('nav button')].find(b => b.querySelector('strong').textContent === name);
      const stored = () => JSON.parse(window.localStorage.getItem('group09-ai-boundary-board-v1'));
      const card = title => [...window.document.querySelectorAll('.agreements > .agreement-card')].find(c => c.querySelector('h3').textContent === title);
      const selected = title => card(title).querySelector('.choice[aria-pressed="true"]');
      await act(() => root.render(React.createElement(App, { key: entry })));
      await act(() => nav('Compare').click());
      assert.deepEqual(stored().agreement, {});
      const enter = entry === 'Agreement' ? nav(entry) : [...window.document.querySelectorAll('button')].find(b => b.textContent.trim() === entry);
      await act(() => enter.click());
      assert.deepEqual(stored().agreement, { brainstorm: { category: 'allowed' }, coding: { category: 'limited' }, debug: { category: 'not_allowed' } });
      assert.deepEqual(stored().preferences, p.preferences);
      for (const [title, category] of [['Brainstorming', 'allowed'], ['Writing code', 'limited'], ['Debugging', 'not_allowed']]) {
        assert.ok(selected(title).classList.contains(category));
        assert.equal(card(title).querySelector('input').value, '');
      }
      assert.equal(selected('Final report'), null);
      assert.match(window.document.querySelector('.download-panel').textContent, /3 of 4 policies recorded/);
      assert.equal(window.document.querySelector('.download-panel button').disabled, true);
      await act(() => card('Brainstorming').querySelector('.choice.limited').click());
      await act(() => card('Final report').querySelector('.choice.not_allowed').click());
      assert.equal(window.document.querySelector('.download-panel button').disabled, false);
      const edited = stored();
      await act(() => nav('Compare').click());
      await act(() => nav('Agreement').click());
      assert.deepEqual(stored(), edited);
      await act(() => root.render(React.createElement(App, { key: entry + '-reload' })));
      await act(() => nav('Agreement').click());
      assert.ok(selected('Brainstorming').classList.contains('limited'));
      assert.ok(selected('Final report').classList.contains('not_allowed'));
      assert.deepEqual(stored(), edited);
    });
  }
  await t.test('optional AI suggestions stay separate until explicitly used as a draft', async t => {
    const originalFetch = globalThis.fetch;
    const originalConfirm = window.confirm;
    t.after(() => { globalThis.fetch = originalFetch; window.confirm = originalConfirm; });
    const result = { summary: 'The two members differ on code generation.', questions: [], options: [{ category: 'limited', condition: 'AI may explain bugs; write submitted code manually.', rationale: 'Supports explanations while preserving manual implementation.' }] };
    const complete = () => {
      const p = createProject();
      p.preferences = p.members.map(() => Object.fromEntries(p.activities.map(a => [a.id, { category: 'allowed', reason: 'Useful with review' }])));
      p.preferences[1].coding = { category: 'not_allowed', reason: 'Write code myself' };
      return p;
    };
    let version = 0;
    const nav = name => [...window.document.querySelectorAll('nav button')].find(b => b.querySelector('strong').textContent === name);
    const button = name => [...window.document.querySelectorAll('button')].find(b => b.textContent.trim() === name);
    const generate = title => window.document.querySelector(`[aria-label="Get AI suggestions for ${title}"]`);
    const stored = () => JSON.parse(window.localStorage.getItem('group09-ai-boundary-board-v1'));
    const load = async p => {
      window.localStorage.setItem('group09-ai-boundary-board-v1', JSON.stringify(p));
      await act(() => root.render(React.createElement(App, { key: `ai-${++version}` })));
      await act(() => nav('Compare').click());
    };
    await t.test('on-demand generation and explicit adoption', async () => {
      const requests = [];
      globalThis.fetch = async (url, options) => { requests.push({ url, ...options }); return Response.json(result); };
      const p = complete();
      await load(p);
      assert.equal(requests.length, 0);
      await act(() => generate('Writing code').click());
      assert.equal(requests.length, 1);
      assert.equal(requests[0].url, '/api/recommendations');
      assert.deepEqual(JSON.parse(requests[0].body), { activity: p.activities[1], preferences: [p.preferences[0].coding, p.preferences[1].coding] });
      assert.ok(window.document.querySelector('.ai-panel').textContent.includes(result.summary));
      assert.deepEqual(stored().agreement, {});
      await act(() => button('Use as draft').click());
      assert.equal(window.document.querySelector('h2').textContent, 'Make it official');
      assert.deepEqual(stored().agreement.coding, { category: result.options[0].category, condition: result.options[0].condition });
      assert.deepEqual(stored().preferences, p.preferences);
      const card = [...window.document.querySelectorAll('.agreements .agreement-card')].find(c => c.querySelector('h3').textContent === 'Writing code');
      assert.equal(card.querySelector('input').value, result.options[0].condition);
    });
    await t.test('incomplete choices block generation and draft adoption appropriately', async () => {
      const p = complete();
      delete p.preferences[1].report;
      await load(p);
      assert.equal(generate('Final report').disabled, true);
      await act(() => generate('Writing code').click());
      assert.equal(button('Use as draft').disabled, true);
      assert.deepEqual(stored().agreement, {});
    });
    await t.test('an aligned activity can still request discussion support', async () => {
      await load(complete());
      assert.equal(generate('Brainstorming').disabled, false);
      await act(() => generate('Brainstorming').click());
      assert.match(window.document.querySelector('.ai-panel h3').textContent, /Brainstorming/);
    });
    await t.test('errors allow retry and suggestions can be skipped', async () => {
      let calls = 0;
      globalThis.fetch = async () => ++calls === 1 ? Response.json({ error: 'AI suggestions are not configured yet.' }, { status: 503 }) : Response.json(result);
      await load(complete());
      await act(() => generate('Writing code').click());
      assert.match(window.document.querySelector('[role="alert"]').textContent, /not configured/);
      await act(() => button('Try again').click());
      assert.equal(calls, 2);
      assert.ok(button('Use as draft'));
      await act(() => button('Skip').click());
      assert.equal(window.document.querySelector('.ai-panel'), null);
      assert.deepEqual(stored().agreement, {});
    });
    await t.test('clarification-only suggestions do not offer an agreement draft', async () => {
      globalThis.fetch = async () => Response.json({ summary: 'Please clarify your reasons.', questions: ['What concerns each member?'], options: [] });
      await load(complete());
      await act(() => generate('Writing code').click());
      assert.match(window.document.querySelector('.ai-questions').textContent, /What concerns each member/);
      assert.equal(button('Use as draft'), undefined);
    });
    await t.test('temporary provider overload is shown without implying a model setup error', async () => {
      globalThis.fetch = async () => Response.json({ error: 'Gemini is temporarily busy or unavailable. Please try again shortly.', provider: 'Gemini', upstreamStatus: 503 }, { status: 503 });
      await load(complete());
      await act(() => generate('Writing code').click());
      assert.match(window.document.querySelector('[role="alert"]').textContent, /Gemini.*temporarily busy/);
      assert.doesNotMatch(window.document.querySelector('[role="alert"]').textContent, /configured model/);
      assert.deepEqual(stored().agreement, {});
    });
    await t.test('late replies cannot restore skipped or superseded suggestions', async () => {
      const replies = [];
      globalThis.fetch = () => new Promise(resolve => replies.push(resolve));
      await load(complete());
      await act(() => generate('Writing code').click());
      assert.ok(window.document.querySelector('[role="status"]'));
      assert.equal(generate('Debugging').disabled, true);
      await act(() => button('Skip').click());
      await act(() => generate('Debugging').click());
      await act(() => replies[0](Response.json(result)));
      assert.match(window.document.querySelector('.ai-panel h3').textContent, /Debugging/);
      assert.ok(window.document.querySelector('[role="status"]'));
      await act(() => nav('Preferences').click());
      await act(() => replies[1](Response.json(result)));
      await act(() => nav('Compare').click());
      assert.equal(window.document.querySelector('.ai-panel'), null);
      assert.deepEqual(stored().agreement, {});
    });
    await t.test('replacing an existing proposed policy requires confirmation', async () => {
      globalThis.fetch = async () => Response.json(result);
      const p = complete();
      p.agreement.coding = { category: 'not_allowed', condition: 'Existing human proposal' };
      await load(p);
      await act(() => generate('Writing code').click());
      window.confirm = () => false;
      await act(() => button('Use as draft').click());
      assert.deepEqual(stored().agreement, p.agreement);
      window.confirm = () => true;
      await act(() => button('Use as draft').click());
      assert.equal(stored().agreement.coding.condition, result.options[0].condition);
    });
    const conditionButton = title => window.document.querySelector(`[aria-label="Get AI condition suggestions for ${title}"]`);
    const agreementCard = title => [...window.document.querySelectorAll('.agreements > .agreement-card')].find(c => c.querySelector('h3').textContent === title);
    const alignedPolicies = { brainstorm: { category: 'allowed' }, debug: { category: 'allowed' }, report: { category: 'allowed' } };
    const loadAgreement = async p => { await load(p); await act(() => nav('Agreement').click()); };
    await t.test('agreement requires a selected policy before generating conditions', async () => {
      let calls = 0;
      globalThis.fetch = async () => { calls++; return Response.json(result); };
      await loadAgreement(complete());
      assert.equal(conditionButton('Writing code').disabled, true);
      await act(() => conditionButton('Writing code').click());
      assert.equal(calls, 0);
      assert.match(agreementCard('Writing code').textContent, /Choose an AI policy/);
    });
    await t.test('agreement suggestions fill only conditions after explicit adoption', async () => {
      const requests = [];
      globalThis.fetch = async (url, options) => { requests.push(JSON.parse(options.body)); return Response.json(result); };
      const p = complete();
      p.agreement.coding = { category: 'limited', condition: '' };
      p.agreement.report = { category: 'allowed', condition: 'Keep the report policy' };
      await loadAgreement(p);
      assert.equal(requests.length, 0);
      await act(() => conditionButton('Writing code').click());
      assert.deepEqual(requests[0], { activity: p.activities[1], preferences: [p.preferences[0].coding, p.preferences[1].coding], agreement: p.agreement.coding });
      assert.deepEqual(stored().agreement, { ...alignedPolicies, ...p.agreement });
      assert.match(agreementCard('Writing code').querySelector('.ai-panel h3').textContent, /AI conditions/);
      assert.equal(button('Use as draft'), undefined);
      await act(() => button('Use for condition').click());
      assert.equal(window.document.querySelector('h2').textContent, 'Make it official');
      assert.equal(stored().agreement.coding.category, 'limited');
      assert.equal(stored().agreement.coding.condition, result.options[0].condition);
      assert.deepEqual(stored().agreement.report, p.agreement.report);
      assert.deepEqual(stored().preferences, p.preferences);
      assert.equal(agreementCard('Writing code').querySelector('input').value, result.options[0].condition);
    });
    await t.test('existing conditions remain until an overwrite is confirmed', async () => {
      const requests = [];
      globalThis.fetch = async (url, options) => { requests.push(JSON.parse(options.body)); return Response.json(result); };
      const p = complete();
      p.agreement.coding = { category: 'limited', condition: 'Existing human-written conditions' };
      await loadAgreement(p);
      await act(() => conditionButton('Writing code').click());
      assert.deepEqual(requests[0].agreement, p.agreement.coding);
      window.confirm = () => false;
      await act(() => button('Use for condition').click());
      assert.deepEqual(stored().agreement, { ...alignedPolicies, ...p.agreement });
      window.confirm = () => true;
      await act(() => button('Use for condition').click());
      assert.deepEqual(stored().agreement.coding, { category: 'limited', condition: result.options[0].condition });
    });
    await t.test('changing the policy discards pending condition suggestions', async () => {
      let reply;
      globalThis.fetch = () => new Promise(resolve => { reply = resolve; });
      const p = complete();
      p.agreement.coding = { category: 'limited', condition: 'Keep this condition' };
      p.agreement.report = { category: 'allowed' };
      await loadAgreement(p);
      await act(() => conditionButton('Writing code').click());
      assert.equal(conditionButton('Final report').disabled, true);
      await act(() => agreementCard('Writing code').querySelector('.choice.allowed').click());
      await act(() => reply(Response.json(result)));
      assert.equal(window.document.querySelector('.ai-panel'), null);
      assert.deepEqual(stored().agreement.coding, { category: 'allowed', condition: 'Keep this condition' });
    });
    await t.test('condition errors can be retried with the same agreement context and skipped', async () => {
      const requests = [];
      globalThis.fetch = async (url, options) => { requests.push(JSON.parse(options.body)); return requests.length === 1 ? Response.json({ error: 'Gemini is temporarily busy.' }, { status: 503 }) : Response.json(result); };
      const p = complete();
      p.agreement.coding = { category: 'limited', condition: 'Existing human condition' };
      await loadAgreement(p);
      await act(() => conditionButton('Writing code').click());
      assert.match(window.document.querySelector('[role="alert"]').textContent, /temporarily busy/);
      await act(() => button('Try again').click());
      assert.equal(requests.length, 2);
      assert.deepEqual(requests[1].agreement, p.agreement.coding);
      assert.ok(button('Use for condition'));
      await act(() => button('Skip').click());
      assert.equal(window.document.querySelector('.ai-panel'), null);
      assert.deepEqual(stored().agreement, { ...alignedPolicies, ...p.agreement });
    });
  });
});
