import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, getComparison, prefillAlignedAgreement, getStats, isValidProject, getAgreementText } from './logic.js';

test('starter project has two members and four activities', () => {
  const p = createProject();
  assert.equal(p.members.length, 2);
  assert.equal(p.activities.length, 4);
  assert.equal(isValidProject(p), true);
});
test('detects disagreement only when both members have answered', () => {
  const p = createProject();
  p.preferences[0].coding = { category: 'allowed', reason: 'Helpful' };
  assert.equal(getComparison(p)[1].disagrees, false);
  p.preferences[1].coding = { category: 'not_allowed', reason: 'Learn myself' };
  assert.equal(getComparison(p)[1].disagrees, true);
  assert.equal(getStats(p).disagreements, 1);
});
test('agreement is represented independently from individual opinions', () => {
  const p = createProject();
  p.agreement.coding = { category: 'limited', condition: 'Review all generated code' };
  assert.equal(getStats(p).resolved, 1);
  assert.match(getAgreementText(p).join('\n'), /Review all generated code/);
});
test('prefills only aligned policies and keeps preferences and conditions separate', () => {
  const p = createProject();
  p.preferences[0] = {
    brainstorm: { category: 'allowed', reason: 'Generate ideas' },
    coding: { category: 'limited', reason: 'Review all code' },
    debug: { category: 'not_allowed' },
    report: { category: 'allowed' },
  };
  p.preferences[1] = {
    brainstorm: { category: 'allowed', reason: 'Explore alternatives' },
    coding: { category: 'limited', reason: 'Explain code only' },
    debug: { category: 'not_allowed' },
    report: { category: 'limited' },
  };
  p.agreement.coding = { condition: 'Keep this restriction' };
  const before = structuredClone(p);
  const filled = prefillAlignedAgreement(p);
  assert.deepEqual(filled.agreement, {
    brainstorm: { category: 'allowed' },
    coding: { category: 'limited', condition: 'Keep this restriction' },
    debug: { category: 'not_allowed' },
  });
  assert.deepEqual(p, before);
  assert.deepEqual(filled.preferences, p.preferences);
  assert.equal(getStats(filled).resolved, 3);
  assert.match(getAgreementText(filled).join('\n'), /Brainstorming: AI Allowed/);
  assert.match(getAgreementText(filled).join('\n'), /Final report: Not decided/);
});

test('incomplete preferences never prefill an agreement', () => {
  const p = createProject();
  p.preferences[0].coding = { category: 'allowed' };
  p.preferences[1].debug = { category: 'limited' };
  p.preferences[0].report = { reason: 'Still deciding' };
  p.preferences[1].report = { reason: 'Still deciding' };
  assert.equal(prefillAlignedAgreement(p), p);
  assert.deepEqual(p.agreement, {});
});

test('prefilling preserves existing policies even when they differ from aligned preferences', () => {
  const p = createProject();
  p.preferences = p.members.map(() => ({ coding: { category: 'allowed' } }));
  p.agreement.coding = { category: 'limited', condition: 'Human review required' };
  assert.equal(prefillAlignedAgreement(p), p);
  assert.deepEqual(p.agreement.coding, { category: 'limited', condition: 'Human review required' });
});

test('rejects malformed saved data', () => {
  assert.equal(isValidProject(null), false);
  assert.equal(isValidProject({members: []}), false);
});
