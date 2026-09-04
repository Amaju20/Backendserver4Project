const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CLIENT_URL',
];

// Fail fast with a clear message instead of limping along and hitting a
// confusing error later (e.g. jwt.sign silently producing a broken token
// if JWT_SECRET is undefined, or mongoose hanging forever on a missing URI).
export function assertRequiredEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}\n` +
        'Check your .env file against .env.example.'
    );
    process.exit(1);
  }
}
