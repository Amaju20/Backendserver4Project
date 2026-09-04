import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { signToken, sendTokenCookie } from '../utils/generateToken.js';

before(() => {
  process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
  process.env.JWT_EXPIRES_IN = '7d';
});

describe('signToken', () => {
  test('signs a token that carries the user id as "sub"', () => {
    const token = signToken('user-123');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(decoded.sub, 'user-123');
  });

  test('rejects verification with the wrong secret', () => {
    const token = signToken('user-123');
    assert.throws(() => jwt.verify(token, 'wrong-secret'));
  });
});

describe('sendTokenCookie', () => {
  function createMockRes() {
    return {
      cookieCalls: [],
      cookie(name, value, options) {
        this.cookieCalls.push({ name, value, options });
      },
    };
  }

  test('sets an httpOnly cookie named "token"', () => {
    const res = createMockRes();
    sendTokenCookie(res, 'a-token-value');
    assert.equal(res.cookieCalls.length, 1);
    assert.equal(res.cookieCalls[0].name, 'token');
    assert.equal(res.cookieCalls[0].value, 'a-token-value');
    assert.equal(res.cookieCalls[0].options.httpOnly, true);
  });

  test('uses non-production cookie flags when NODE_ENV is not "production"', () => {
    process.env.NODE_ENV = 'development';
    const res = createMockRes();
    sendTokenCookie(res, 'a-token-value');
    assert.equal(res.cookieCalls[0].options.secure, false);
    assert.equal(res.cookieCalls[0].options.sameSite, 'lax');
  });

  test('uses production cookie flags when NODE_ENV is "production"', () => {
    process.env.NODE_ENV = 'production';
    const res = createMockRes();
    sendTokenCookie(res, 'a-token-value');
    assert.equal(res.cookieCalls[0].options.secure, true);
    assert.equal(res.cookieCalls[0].options.sameSite, 'none');
    process.env.NODE_ENV = 'development';
  });

  test('derives cookie maxAge from JWT_EXPIRES_IN (e.g. "7d")', () => {
    process.env.JWT_EXPIRES_IN = '7d';
    const res = createMockRes();
    sendTokenCookie(res, 'a-token-value');
    assert.equal(res.cookieCalls[0].options.maxAge, 7 * 24 * 60 * 60 * 1000);
  });
});
