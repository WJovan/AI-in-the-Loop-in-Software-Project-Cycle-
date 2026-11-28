import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRecommendationHandler } from './ai.js';

const input = { activity: { title: 'Writing code', description: 'Generate or modify code' }, preferences: [{ category: 'limited', reason: 'Review generated code' }, { category: 'not_allowed', reason: 'Write code manually' }] };
const suggestion = { summary: 'Members differ on generating code.', strongReasonConflict: false, questions: [], options: [{ category: 'not_allowed', condition: 'Write submitted code manually.', rationale: 'Preserves the preference for writing code without AI.' }] };
const output = (data = suggestion) => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(data) }] }] });
const claudeOutput = (data = suggestion) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(data) }] });
const geminiOutput = (data = suggestion) => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(data) }] } }] });
async function start(t, options = {}) {
  const handler = createRecommendationHandler({ env: { OPENAI_API_KEY: 'test-private-key' }, fetchImpl: async () => Response.json(output()), retryDelayMs: 0, ...options });
  const server = createServer((req, res) => handler(req, res, () => { res.writeHead(404); res.end(); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const url = `http://127.0.0.1:${server.address().port}`;
  return (options = {}) => new Promise((resolve, reject) => {
    const { body, ...init } = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), ...options };
    // Node HTTP accepts every ephemeral test port, including ports blocked by fetch.
    const req = request(`${url}/api/recommendations`, init, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: response.statusCode, headers: response.headers })));
    });
    req.on('error', reject);
    req.end(body);
  });
}

test('AI endpoint sends only selected perspectives and returns validated suggestions', async t => {
  let request;
  const post = await start(t, { env: { OPENAI_API_KEY: 'test-private-key', OPENAI_MODEL: 'chosen-model' }, fetchImpl: async (url, options) => { request = { url, ...options }; return Response.json(output()); } });
  const response = await post({ body: JSON.stringify({ ...input, apiKey: 'untrusted', members: ['Private name'], otherAgreements: { coding: 'private' } }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), suggestion);
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(request.headers.Authorization, 'Bearer test-private-key');
  const body = JSON.parse(request.body);
  assert.equal(body.model, 'chosen-model');
  assert.equal(body.store, false);
  assert.equal(body.text.format.strict, true);
  assert.deepEqual(JSON.parse(body.input), input);
  assert.ok(!request.body.includes('test-private-key'));
});

test('AI endpoint rejects invalid requests before calling OpenAI', async t => {
  for (const [name, options, expected] of [
    ['wrong method', { method: 'GET', body: undefined }, 405],
    ['cross-origin', { headers: { 'Content-Type': 'application/json', Origin: 'https://elsewhere.example' } }, 403],
    ['malformed origin', { headers: { 'Content-Type': 'application/json', Origin: 'invalid' } }, 403],
    ['cross-site', { headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site' } }, 403],
    ['wrong content type', { headers: { 'Content-Type': 'text/plain' } }, 415],
    ['invalid JSON', { body: '{' }, 400],
    ['missing selections', { body: JSON.stringify({ ...input, preferences: [{}] }) }, 400],
    ['invalid category', { body: JSON.stringify({ ...input, preferences: [{ category: 'unknown' }, input.preferences[1]] }) }, 400],
    ['long reason', { body: JSON.stringify({ ...input, preferences: [{ category: 'limited', reason: 'x'.repeat(2001) }, input.preferences[1]] }) }, 400],
    ['oversized body', { body: 'x'.repeat(16385) }, 413],
  ]) await t.test(name, async t => {
    let calls = 0;
    const post = await start(t, { fetchImpl: async () => { calls++; throw new Error('Should not call OpenAI'); } });
    const response = await post(options);
    assert.equal(response.status, expected);
    assert.equal(calls, 0);
  });
  await t.test('missing key', async t => {
    const post = await start(t, { env: {} });
    assert.equal((await post()).status, 503);
  });
  await t.test('all keys blank', async t => {
    const post = await start(t, { env: { ANTHROPIC_API_KEY: ' ', OPENAI_API_KEY: '', GEMINI_API_KEY: '\t' } });
    assert.equal((await post()).status, 503);
  });
});

test('condition suggestions include only the selected policy and existing condition for every provider', async t => {
  const agreement = { category: 'limited', condition: 'Review every generated change together' };
  const result = { ...suggestion, options: [{ ...suggestion.options[0], category: 'limited', condition: 'Both members must review and test each AI-generated change before submission.' }] };
  for (const [name, env, makeOutput] of [
    ['Claude', { ANTHROPIC_API_KEY: 'secret' }, claudeOutput],
    ['GPT', { OPENAI_API_KEY: 'secret' }, output],
    ['Gemini', { GEMINI_API_KEY: 'secret' }, geminiOutput],
  ]) await t.test(name, async t => {
    let body;
    const post = await start(t, { env, fetchImpl: async (url, options) => { body = JSON.parse(options.body); return Response.json(makeOutput(result)); } });
    const response = await post({ body: JSON.stringify({ ...input, agreement: { ...agreement, otherActivity: 'private' }, members: ['Private name'] }) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), result);
    const prompt = name === 'Claude' ? body.messages[0].content : name === 'Gemini' ? body.contents[0].parts[0].text : body.input;
    assert.deepEqual(JSON.parse(prompt), { ...input, agreement });
    const system = name === 'Claude' ? body.system : name === 'Gemini' ? body.systemInstruction.parts[0].text : body.instructions;
    assert.match(system, /Keep that category unchanged/);
    assert.doesNotMatch(prompt, /private|Private name/);
  });
});

test('invalid agreement context is rejected before calling a provider', async t => {
  for (const agreement of [null, {}, { category: 'unknown' }, { category: 'limited', condition: 'x'.repeat(501) }, { category: 'limited', condition: 42 }]) await t.test(JSON.stringify({ category: agreement?.category, conditionType: typeof agreement?.condition }), async t => {
    let calls = 0;
    const post = await start(t, { fetchImpl: async () => { calls++; return Response.json(output()); } });
    assert.equal((await post({ body: JSON.stringify({ ...input, agreement }) })).status, 400);
    assert.equal(calls, 0);
  });
});

test('condition suggestions cannot recommend a different policy', async t => {
  const post = await start(t);
  const response = await post({ body: JSON.stringify({ ...input, agreement: { category: 'limited', condition: '' } }) });
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /valid suggestion/);
});

test('provider selection follows Claude, GPT, Gemini key priority', async t => {
  for (const [name, env, selected] of [
    ['Claude only', { ANTHROPIC_API_KEY: 'claude-secret' }, 'claude'],
    ['GPT only', { OPENAI_API_KEY: 'gpt-secret' }, 'openai'],
    ['Gemini only', { GEMINI_API_KEY: 'gemini-secret' }, 'gemini'],
    ['Claude before GPT', { ANTHROPIC_API_KEY: 'claude-secret', OPENAI_API_KEY: 'gpt-secret' }, 'claude'],
    ['Claude before Gemini', { ANTHROPIC_API_KEY: 'claude-secret', GEMINI_API_KEY: 'gemini-secret' }, 'claude'],
    ['GPT before Gemini', { OPENAI_API_KEY: 'gpt-secret', GEMINI_API_KEY: 'gemini-secret' }, 'openai'],
    ['all three', { ANTHROPIC_API_KEY: 'claude-secret', OPENAI_API_KEY: 'gpt-secret', GEMINI_API_KEY: 'gemini-secret' }, 'claude'],
    ['blank Claude key', { ANTHROPIC_API_KEY: '  ', OPENAI_API_KEY: 'gpt-secret', GEMINI_API_KEY: 'gemini-secret' }, 'openai'],
    ['blank higher priority keys', { ANTHROPIC_API_KEY: '', OPENAI_API_KEY: ' \t ', GEMINI_API_KEY: 'gemini-secret' }, 'gemini'],
  ]) await t.test(name, async t => {
    const requests = [];
    const post = await start(t, { env, fetchImpl: async (url, options) => {
      requests.push({ url, ...options });
      return Response.json(selected === 'claude' ? claudeOutput() : selected === 'gemini' ? geminiOutput() : output());
    } });
    const response = await post({ body: JSON.stringify({ ...input, members: ['Private name'], apiKey: 'untrusted' }) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), suggestion);
    assert.equal(requests.length, 1);
    const request = requests[0];
    const body = JSON.parse(request.body);
    assert.equal(request.headers['Content-Type'], 'application/json');
    assert.doesNotMatch(request.url + request.body, /claude-secret|gpt-secret|gemini-secret|Private name|untrusted/);
    if (selected === 'claude') {
      assert.equal(request.url, 'https://api.anthropic.com/v1/messages');
      assert.equal(request.headers['x-api-key'], 'claude-secret');
      assert.equal(request.headers['anthropic-version'], '2023-06-01');
      assert.equal(request.headers.Authorization, undefined);
      assert.equal(request.headers['x-goog-api-key'], undefined);
      assert.equal(body.model, 'claude-haiku-5-5');
      assert.deepEqual(JSON.parse(body.messages[0].content), input);
      assert.equal(body.output_config.format.type, 'json_schema');
      assert.doesNotMatch(JSON.stringify(body.output_config.format.schema), /minLength|maxLength|maxItems/);
      assert.match(body.output_config.format.schema.properties.summary.description, /1200/);
    } else if (selected === 'gemini') {
      assert.equal(request.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
      assert.equal(request.headers['x-goog-api-key'], 'gemini-secret');
      assert.equal(request.headers.Authorization, undefined);
      assert.equal(request.headers['x-api-key'], undefined);
      assert.deepEqual(JSON.parse(body.contents[0].parts[0].text), input);
      assert.equal(body.generationConfig.responseMimeType, 'application/json');
      assert.deepEqual(body.generationConfig.responseJsonSchema.required, ['summary', 'questions', 'options', 'strongReasonConflict']);
      assert.match(body.systemInstruction.parts[0].text, /Humans must discuss/);
    } else {
      assert.equal(request.url, 'https://api.openai.com/v1/responses');
      assert.equal(request.headers.Authorization, 'Bearer gpt-secret');
      assert.equal(request.headers['x-api-key'], undefined);
      assert.equal(request.headers['x-goog-api-key'], undefined);
      assert.equal(body.model, 'gpt-5.4-mini');
      assert.deepEqual(JSON.parse(body.input), input);
    }
  });
});

test('provider keys and model overrides are trimmed and kept on the server', async t => {
  for (const [env, makeOutput, expectedModel, header, key] of [
    [{ ANTHROPIC_API_KEY: ' claude-secret ', ANTHROPIC_MODEL: ' custom-claude ' }, claudeOutput, 'custom-claude', 'x-api-key', 'claude-secret'],
    [{ OPENAI_API_KEY: ' gpt-secret ', OPENAI_MODEL: ' custom-gpt ' }, output, 'custom-gpt', 'Authorization', 'Bearer gpt-secret'],
    [{ GEMINI_API_KEY: ' gemini-secret ', GEMINI_MODEL: ' custom-gemini ' }, geminiOutput, 'custom-gemini', 'x-goog-api-key', 'gemini-secret'],
  ]) await t.test(expectedModel, async t => {
    let request;
    const post = await start(t, { env, fetchImpl: async (url, options) => { request = { url, ...options }; return Response.json(makeOutput()); } });
    assert.equal((await post()).status, 200);
    assert.equal(request.headers[header], key);
    if (env.GEMINI_MODEL) assert.ok(request.url.endsWith(`/${expectedModel}:generateContent`));
    else assert.equal(JSON.parse(request.body).model, expectedModel);
  });
});

test('Claude and Gemini reject incomplete, blocked and invalid suggestions', async t => {
  for (const [name, env, result] of [
    ['Claude refusal', { ANTHROPIC_API_KEY: 'secret' }, { ...claudeOutput(), stop_reason: 'refusal' }],
    ['Claude token limit', { ANTHROPIC_API_KEY: 'secret' }, { ...claudeOutput(), stop_reason: 'max_tokens' }],
    ['Claude empty content', { ANTHROPIC_API_KEY: 'secret' }, { ...claudeOutput(), content: [] }],
    ['Claude long condition', { ANTHROPIC_API_KEY: 'secret' }, claudeOutput({ ...suggestion, options: [{ ...suggestion.options[0], condition: 'x'.repeat(501) }] })],
    ['Claude too many options', { ANTHROPIC_API_KEY: 'secret' }, claudeOutput({ ...suggestion, options: Array(3).fill(suggestion.options[0]) })],
    ['Gemini blocked prompt', { GEMINI_API_KEY: 'secret' }, { ...geminiOutput(), promptFeedback: { blockReason: 'SAFETY' } }],
    ['Gemini safety stop', { GEMINI_API_KEY: 'secret' }, { candidates: [{ ...geminiOutput().candidates[0], finishReason: 'SAFETY' }] }],
    ['Gemini token limit', { GEMINI_API_KEY: 'secret' }, { candidates: [{ ...geminiOutput().candidates[0], finishReason: 'MAX_TOKENS' }] }],
    ['Gemini empty candidates', { GEMINI_API_KEY: 'secret' }, { candidates: [] }],
    ['Gemini invalid category', { GEMINI_API_KEY: 'secret' }, geminiOutput({ ...suggestion, options: [{ ...suggestion.options[0], category: 'unknown' }] })],
  ]) await t.test(name, async t => {
    const post = await start(t, { env, fetchImpl: async () => Response.json(result) });
    assert.equal((await post()).status, 502);
  });
});

test('Gemini thought parts are excluded from structured output', async t => {
  const result = geminiOutput();
  result.candidates[0].content.parts.unshift({ thought: true, text: 'Not JSON, and not a suggestion.' });
  const post = await start(t, { env: { GEMINI_API_KEY: 'secret' }, fetchImpl: async () => Response.json(result) });
  assert.deepEqual(await (await post()).json(), suggestion);
});

test('a configured higher priority provider is called once even when it fails', async t => {
  let calls = 0;
  const post = await start(t, { env: { ANTHROPIC_API_KEY: 'claude-secret', OPENAI_API_KEY: 'gpt-secret', GEMINI_API_KEY: 'gemini-secret' }, fetchImpl: async url => {
    calls++;
    assert.equal(url, 'https://api.anthropic.com/v1/messages');
    return new Response('private upstream details', { status: 401 });
  } });
  const response = await post();
  assert.equal(response.status, 502);
  assert.equal(calls, 1);
  assert.match((await response.json()).error, /credentials were rejected/);
});

test('temporary failures are retried once on the same provider and deadline', async t => {
  for (const [name, env, makeOutput, hostname] of [
    ['Gemini', { GEMINI_API_KEY: 'gemini-secret' }, geminiOutput, 'generativelanguage.googleapis.com'],
    ['Claude priority', { ANTHROPIC_API_KEY: 'claude-secret', OPENAI_API_KEY: 'gpt-secret', GEMINI_API_KEY: 'gemini-secret' }, claudeOutput, 'api.anthropic.com'],
  ]) await t.test(name, async t => {
    const requests = [];
    const post = await start(t, { env, fetchImpl: async (url, options) => {
      requests.push({ url, ...options });
      return requests.length === 1 ? new Response('provider high demand', { status: 503 }) : Response.json(makeOutput());
    } });
    const response = await post();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), suggestion);
    assert.equal(requests.length, 2);
    assert.equal(new URL(requests[0].url).hostname, hostname);
    assert.equal(requests[0].url, requests[1].url);
    assert.equal(requests[0].body, requests[1].body);
    assert.equal(requests[0].signal, requests[1].signal);
  });
});

test('persistent Gemini overload is reported as temporary service failure', async t => {
  let calls = 0;
  const post = await start(t, { env: { GEMINI_API_KEY: 'gemini-secret' }, fetchImpl: async () => {
    calls++;
    return Response.json({ error: { status: 'UNAVAILABLE', message: 'private provider detail' } }, { status: 503 });
  } });
  const response = await post();
  const data = await response.json();
  assert.equal(response.status, 503);
  assert.equal(calls, 2);
  assert.match(data.error, /Gemini.*temporarily busy/);
  assert.doesNotMatch(data.error, /configured model|private provider detail|gemini-secret/);
  assert.equal(data.provider, 'Gemini');
  assert.equal(data.upstreamStatus, 503);
});

test('the environment example contains no private key values', async () => {
  const contents = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
  const keys = [...contents.matchAll(/^(?:ANTHROPIC|OPENAI|GEMINI)_API_KEY=(.*)$/gm)];
  assert.equal(keys.length, 3);
  assert.ok(keys.every(match => !match[1].trim()), 'Private API keys belong in .env, not .env.example');
});

test('one missing reason produces questions without adoptable options', async t => {
  for (const [name, env, makeOutput] of [
    ['Claude', { ANTHROPIC_API_KEY: 'secret' }, claudeOutput],
    ['GPT', { OPENAI_API_KEY: 'secret' }, output],
    ['Gemini', { GEMINI_API_KEY: 'secret' }, geminiOutput],
  ]) await t.test(name, async t => {
    const post = await start(t, { env, fetchImpl: async () => Response.json(makeOutput()) });
    const response = await post({ body: JSON.stringify({ ...input, preferences: [{ category: 'limited' }, input.preferences[1]] }) });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(data.options, []);
    assert.ok(data.questions.length > 0);
  });
});

test('two missing reasons produce basic activity guidance instead of a missing-preferences reply', async t => {
  const debugging = {
    activity: { title: 'Debugging', description: 'Find and understand errors' },
    preferences: [{ category: 'allowed' }, { category: 'limited' }],
  };
  const missingReply = { summary: 'Preferences are missing.', strongReasonConflict: false, questions: ['What are your preferences?'], options: [] };
  for (const [name, env, makeOutput] of [
    ['Claude', { ANTHROPIC_API_KEY: 'secret' }, claudeOutput],
    ['GPT', { OPENAI_API_KEY: 'secret' }, output],
    ['Gemini', { GEMINI_API_KEY: 'secret' }, geminiOutput],
  ]) await t.test(name, async t => {
    const post = await start(t, { env, fetchImpl: async () => Response.json(makeOutput(missingReply)) });
    const response = await post({ body: JSON.stringify(debugging) });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.doesNotMatch(data.summary, /preferences? (?:are|is) missing/i);
    assert.deepEqual(data.questions, []);
    assert.equal(data.options.length, 2);
    assert.ok(data.options.every(option => /potential issues|code behavior/i.test(option.condition)));
  });
});

test('two directions are limited to different policies or strongly conflicting reasons', async t => {
  const options = [
    { category: 'limited', condition: 'Use AI only for grammar checks.', rationale: 'Keeps AI use narrow.' },
    { category: 'limited', condition: 'AI may generate a full draft when both members review it.', rationale: 'Allows broader use with review.' },
  ];
  const samePolicy = {
    ...input,
    preferences: [{ category: 'limited', reason: 'Review every output' }, { category: 'limited', reason: 'AI saves time' }],
  };
  await t.test('same policy with ordinary reason differences keeps one direction', async t => {
    const response = { ...suggestion, strongReasonConflict: false, options };
    const post = await start(t, { fetchImpl: async () => Response.json(output(response)) });
    const data = await (await post({ body: JSON.stringify(samePolicy) })).json();
    assert.equal(data.options.length, 1);
  });
  await t.test('same policy with mutually incompatible boundaries can keep two directions', async t => {
    const conflicting = {
      ...samePolicy,
      preferences: [{ category: 'limited', reason: 'Only grammar checks; never generate prose' }, { category: 'limited', reason: 'Full draft generation is acceptable after review' }],
    };
    const response = { ...suggestion, strongReasonConflict: true, options };
    const post = await start(t, { fetchImpl: async () => Response.json(output(response)) });
    const data = await (await post({ body: JSON.stringify(conflicting) })).json();
    assert.equal(data.options.length, 2);
  });
  await t.test('different policies can keep two directions', async t => {
    const response = { ...suggestion, strongReasonConflict: false, options: options.map((option, index) => ({ ...option, category: index ? 'not_allowed' : 'limited' })) };
    const post = await start(t, { fetchImpl: async () => Response.json(output(response)) });
    const data = await (await post()).json();
    assert.equal(data.options.length, 2);
  });
  await t.test('blank reasons never count as a strong conflict when policies match', async t => {
    const response = { ...suggestion, strongReasonConflict: true, options };
    const post = await start(t, { fetchImpl: async () => Response.json(output(response)) });
    const data = await (await post({ body: JSON.stringify({ ...samePolicy, preferences: [{ category: 'limited' }, { category: 'limited' }] }) })).json();
    assert.equal(data.options.length, 1);
    assert.equal(data.strongReasonConflict, false);
  });
});

test('AI failures return safe errors without exposing upstream details', async t => {
  for (const [name, fetchImpl, expected] of [
    ['credentials', async () => new Response('test-private-key: internal details', { status: 401 }), 502],
    ['quota', async () => new Response('internal quota details', { status: 429 }), 429],
    ['provider unavailable', async () => new Response('internal details', { status: 503 }), 503],
    ['missing model', async () => new Response('private model details', { status: 404 }), 502],
    ['unsupported request', async () => new Response('private request details', { status: 400 }), 502],
    ['invalid JSON', async () => new Response('invalid JSON'), 502],
    ['invalid output', async () => Response.json(output({ ...suggestion, options: [{ ...suggestion.options[0], category: 'unknown' }] })), 502],
    ['long condition', async () => Response.json(output({ ...suggestion, options: [{ ...suggestion.options[0], condition: 'x'.repeat(501) }] })), 502],
    ['empty output', async () => Response.json(output({ ...suggestion, options: [] })), 502],
    ['refusal', async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'private details' }] }] }), 502],
    ['incomplete', async () => Response.json({ ...output(), status: 'incomplete' }), 502],
    ['timeout', async () => { throw new DOMException('internal details', 'TimeoutError'); }, 504],
    ['network failure', async () => { throw new Error('test-private-key'); }, 502],
  ]) await t.test(name, async t => {
    let calls = 0;
    const post = await start(t, { fetchImpl: (...args) => { calls++; return fetchImpl(...args); } });
    const response = await post();
    assert.equal(response.status, expected);
    const data = await response.json();
    assert.equal(typeof data.error, 'string');
    assert.doesNotMatch(data.error, /test-private-key|internal details|private details/);
    assert.equal(calls, name === 'provider unavailable' ? 2 : 1);
    if (name === 'missing model') assert.match(data.error, /model was not found/);
    if (name === 'unsupported request') assert.match(data.error, /rejected the request/);
  });
});
