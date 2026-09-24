import { users } from '../data/fixtures';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default () => {
  const port = Number(
    process.env.PORT ?? 3000,
  );

  const frontendOrigin =
    process.env.FRONTEND_ORIGIN ??
    'http://localhost:5173';

  const demoUserId =
    process.env.DEMO_USER_ID ?? '';

  const simulatedIoMs = Number(
    process.env.SIMULATED_IO_MS ?? 0,
  );

  const databaseUrl =
    process.env.DATABASE_URL ?? '';

  const databaseConnectTimeoutMs = Number(
    process.env.DATABASE_CONNECT_TIMEOUT_MS ??
      5000,
  );

  // --------------------------------------------------
  // PORT
  // --------------------------------------------------

  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(
      'PORT must be an integer from 1 to 65535',
    );
  }

  // --------------------------------------------------
  // FRONTEND_ORIGIN
  // --------------------------------------------------

  try {
    const origin = new URL(frontendOrigin);

    if (
      origin.protocol !== 'http:' &&
      origin.protocol !== 'https:'
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      'FRONTEND_ORIGIN must be a valid HTTP or HTTPS origin',
    );
  }

  // --------------------------------------------------
  // DEMO_USER_ID
  // --------------------------------------------------

  if (!UUID_REGEX.test(demoUserId)) {
    throw new Error(
      'DEMO_USER_ID must be a valid UUID',
    );
  }

  const demoUserExists = users.some(
    (user) => user.id === demoUserId,
  );

  if (!demoUserExists) {
    throw new Error(
      'DEMO_USER_ID must match a seeded user',
    );
  }

  // --------------------------------------------------
  // SIMULATED_IO_MS
  // --------------------------------------------------

  if (
    !Number.isInteger(simulatedIoMs) ||
    simulatedIoMs < 0 ||
    simulatedIoMs > 1000
  ) {
    throw new Error(
      'SIMULATED_IO_MS must be an integer from 0 to 1000',
    );
  }

  // --------------------------------------------------
  // DATABASE_URL
  // --------------------------------------------------

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required',
    );
  }

  try {
    const url = new URL(databaseUrl);

    if (url.protocol !== 'postgresql:') {
      throw new Error();
    }

    if (!url.hostname) {
      throw new Error();
    }

    if (
      !url.pathname ||
      url.pathname === '/'
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      'DATABASE_URL must be a valid PostgreSQL connection URL',
    );
  }

  // --------------------------------------------------
  // DATABASE_CONNECT_TIMEOUT_MS
  // --------------------------------------------------

  if (
    !Number.isInteger(
      databaseConnectTimeoutMs,
    ) ||
    databaseConnectTimeoutMs < 1000 ||
    databaseConnectTimeoutMs > 30000
  ) {
    throw new Error(
      'DATABASE_CONNECT_TIMEOUT_MS must be an integer from 1000 to 30000',
    );
  }

  return {
    port,
    frontendOrigin,
    demoUserId,
    simulatedIoMs,
    databaseUrl,
    databaseConnectTimeoutMs,
  };
};