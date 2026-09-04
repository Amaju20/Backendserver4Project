import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { notFound, errorHandler } from '../middleware/error.middleware.js';

function createMockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('notFound', () => {
  test('responds 404 with the method and path', () => {
    const req = { method: 'GET', originalUrl: '/api/does-not-exist' };
    const res = createMockRes();
    notFound(req, res, () => {});
    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /GET \/api\/does-not-exist/);
  });
});

describe('errorHandler', () => {
  // Silence the handler's console.error for these tests — it's expected
  // to log, we just don't want it cluttering test output.
  const silence = () => {};

  test('maps a Mongo duplicate-key error (11000) to 409', () => {
    const res = createMockRes();
    const err = { code: 11000, keyValue: { email: 'dana@example.com' } };
    const originalError = console.error;
    console.error = silence;
    errorHandler(err, {}, res, () => {});
    console.error = originalError;

    assert.equal(res.statusCode, 409);
    assert.match(res.body.message, /email is already in use/i);
  });

  test('uses err.statusCode when present', () => {
    const res = createMockRes();
    const err = { statusCode: 401, message: 'Invalid credentials' };
    const originalError = console.error;
    console.error = silence;
    errorHandler(err, {}, res, () => {});
    console.error = originalError;

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, 'Invalid credentials');
  });

  test('defaults to 500 with a generic message for an unrecognized error', () => {
    const res = createMockRes();
    const err = new Error();
    err.message = '';
    const originalError = console.error;
    console.error = silence;
    errorHandler(err, {}, res, () => {});
    console.error = originalError;

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Internal server error');
  });
});
