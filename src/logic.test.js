import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, getComparison, getStats, isValidProject, getAgreementText } from './logic.js';

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
test('rejects malformed saved data', () => {
  assert.equal(isValidProject(null), false);
  assert.equal(isValidProject({members: []}), false);
});
