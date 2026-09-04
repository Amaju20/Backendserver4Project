import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.validator.js';

describe('signupSchema', () => {
  const validPayload = {
    name: 'Dana Verified',
    username: 'danaverify9',
    email: 'dana@example.com',
    password: 'Verify123',
  };

  test('accepts a valid signup payload', () => {
    const { error } = signupSchema.validate(validPayload);
    assert.equal(error, undefined);
  });

  test('rejects a password missing an uppercase letter', () => {
    const { error } = signupSchema.validate({ ...validPayload, password: 'verify123' });
    assert.ok(error);
    assert.match(error.details[0].message, /uppercase/i);
  });

  test('rejects a password missing a number', () => {
    const { error } = signupSchema.validate({ ...validPayload, password: 'VerifyOnly' });
    assert.ok(error);
  });

  test('rejects a password under 8 characters', () => {
    const { error } = signupSchema.validate({ ...validPayload, password: 'Ab1defg' });
    assert.ok(error);
  });

  test('rejects a username with special characters', () => {
    const { error } = signupSchema.validate({ ...validPayload, username: 'dana-verify!' });
    assert.ok(error);
    assert.match(error.details[0].message, /letters, numbers, and underscores/i);
  });

  test('rejects an invalid email', () => {
    const { error } = signupSchema.validate({ ...validPayload, email: 'not-an-email' });
    assert.ok(error);
  });

  test('rejects a missing name', () => {
    const { name, ...rest } = validPayload;
    const { error } = signupSchema.validate(rest);
    assert.ok(error);
  });
});

describe('loginSchema', () => {
  test('accepts email or username as the identifier', () => {
    assert.equal(loginSchema.validate({ identifier: 'dana@example.com', password: 'x' }).error, undefined);
    assert.equal(loginSchema.validate({ identifier: 'danaverify9', password: 'x' }).error, undefined);
  });

  test('rejects an empty identifier', () => {
    const { error } = loginSchema.validate({ identifier: '', password: 'x' });
    assert.ok(error);
  });

  test('rejects a missing password', () => {
    const { error } = loginSchema.validate({ identifier: 'dana@example.com' });
    assert.ok(error);
  });
});

describe('updateProfileSchema', () => {
  test('accepts a valid name', () => {
    assert.equal(updateProfileSchema.validate({ name: 'Dana Verified' }).error, undefined);
  });

  test('rejects a one-character name', () => {
    const { error } = updateProfileSchema.validate({ name: 'D' });
    assert.ok(error);
  });
});

describe('changePasswordSchema', () => {
  test('accepts a valid payload', () => {
    const { error } = changePasswordSchema.validate({
      currentPassword: 'Verify123',
      newPassword: 'Verify456',
    });
    assert.equal(error, undefined);
  });

  test('rejects a weak new password even with a valid current password', () => {
    const { error } = changePasswordSchema.validate({
      currentPassword: 'Verify123',
      newPassword: 'weak',
    });
    assert.ok(error);
  });

  test('rejects a missing current password', () => {
    const { error } = changePasswordSchema.validate({ newPassword: 'Verify456' });
    assert.ok(error);
  });
});
