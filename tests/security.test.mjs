import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

Object.defineProperty(globalThis, 'crypto', {
	value: {
		subtle: {
			async digest(algorithm, data) {
				if (String(algorithm).toUpperCase() !== 'MD5') {
					throw new Error(`Unsupported digest algorithm: ${algorithm}`);
				}
				const digest = createHash('md5').update(Buffer.from(data)).digest();
				return digest.buffer.slice(digest.byteOffset, digest.byteOffset + digest.byteLength);
			},
		},
	},
	configurable: true,
});

const source = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
const workerModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const worker = workerModule.default;

function createKV(initial = {}) {
	const data = new Map(Object.entries(initial));
	return {
		async get(key) {
			return data.has(key) ? data.get(key) : null;
		},
		async put(key, value) {
			data.set(key, value);
		},
		async list({ prefix = '' } = {}) {
			return {
				keys: Array.from(data.keys())
					.filter((name) => name.startsWith(prefix))
					.map((name) => ({ name })),
			};
		},
	};
}

function request(path, headers = {}) {
	return new Request(`https://worker.example${path}`, {
		headers: {
			Accept: 'text/html',
			'User-Agent': 'Mozilla/5.0',
			...headers,
		},
	});
}

test('unauthenticated SUB landing page does not expose guest subscription token', async () => {
	const response = await worker.fetch(request('/sub1'), {
		TOKEN: 'admin-secret',
		GUESTTOKEN: 'guest-secret',
		KV: createKV(),
	});
	const body = await response.text();

	assert.equal(body.includes('guest-secret'), false);
	assert.equal(body.includes('/sub1/sub?token='), false);
	assert.notEqual(response.headers.get('content-type'), 'text/html;charset=utf-8');
});

test('unauthenticated private paths do not fall through to camouflage proxy', async (t) => {
	const originalFetch = globalThis.fetch;
	let proxiedUrl = '';
	globalThis.fetch = async (url) => {
		proxiedUrl = String(url);
		return new Response('proxied private path', {
			headers: { 'Content-Type': 'text/plain' },
		});
	};
	t.after(() => {
		globalThis.fetch = originalFetch;
	});

	const env = {
		TOKEN: 'admin-secret',
		GUESTTOKEN: 'guest-secret',
		URL: 'https://camouflage.example/base',
		KV: createKV(),
	};

	for (const path of ['/sub', '/sub1', '/sub1/sub', '/manage', '/files/bestip.txt']) {
		proxiedUrl = '';
		const response = await worker.fetch(request(path), env);
		const body = await response.text();

		assert.notEqual(response.status, 200, `${path} should reject unauthenticated access`);
		assert.equal(proxiedUrl, '', `${path} should not be proxied`);
		assert.equal(body.includes('proxied private path'), false);
		assert.equal(body.includes('guest-secret'), false);
	}
});

test('unauthenticated private paths do not fall through to camouflage redirect', async () => {
	const env = {
		TOKEN: 'admin-secret',
		GUESTTOKEN: 'guest-secret',
		URL302: 'https://camouflage.example/',
		KV: createKV(),
	};

	for (const path of ['/sub', '/sub1', '/sub1/sub', '/manage', '/files/bestip.txt']) {
		const response = await worker.fetch(request(path), env);
		const body = await response.text();

		assert.equal([401, 404].includes(response.status), true, `${path} should reject unauthenticated access`);
		assert.equal(response.headers.has('location'), false, `${path} should not redirect`);
		assert.equal(body.includes('guest-secret'), false);
	}
});
