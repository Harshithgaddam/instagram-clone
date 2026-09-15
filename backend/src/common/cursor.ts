export interface CursorPayload {
  v: 1;
  createdAt: string;
  id: string;
}

const MAX_CURSOR_LENGTH = 1024;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ISO_TIMESTAMP_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const BASE64URL_REGEX =
  /^[A-Za-z0-9_-]+$/;

export function encodeCursor(
  createdAt: string,
  id: string,
): string {
  const payload: CursorPayload = {
    v: 1,
    createdAt,
    id,
  };

  return Buffer
    .from(JSON.stringify(payload))
    .toString('base64url');
}

export function decodeCursor(
  cursor: string,
): CursorPayload {
  if (!cursor) {
    throw new Error(
      'Cursor is required',
    );
  }

  if (
    cursor.length > MAX_CURSOR_LENGTH
  ) {
    throw new Error(
      'Cursor is too long',
    );
  }

  if (
    !BASE64URL_REGEX.test(cursor)
  ) {
    throw new Error(
      'Invalid cursor encoding',
    );
  }

  let decoded: string;

  try {
    decoded =
      Buffer
        .from(cursor, 'base64url')
        .toString('utf8');
  } catch {
    throw new Error(
      'Invalid cursor encoding',
    );
  }

  let payload: unknown;

  try {
    payload =
      JSON.parse(decoded);
  } catch {
    throw new Error(
      'Invalid cursor payload',
    );
  }

  if (
    typeof payload !== 'object' ||
    payload === null
  ) {
    throw new Error(
      'Invalid cursor payload',
    );
  }

  const value =
    payload as Record<
      string,
      unknown
    >;

  if (value.v !== 1) {
    throw new Error(
      'Unsupported cursor version',
    );
  }

  if (
    typeof value.createdAt !==
      'string' ||
    !ISO_TIMESTAMP_REGEX.test(
      value.createdAt,
    )
  ) {
    throw new Error(
      'Invalid cursor timestamp',
    );
  }

  if (
    Number.isNaN(
      Date.parse(
        value.createdAt,
      ),
    )
  ) {
    throw new Error(
      'Invalid cursor timestamp',
    );
  }

  if (
    typeof value.id !==
      'string' ||
    !UUID_REGEX.test(value.id)
  ) {
    throw new Error(
      'Invalid cursor id',
    );
  }

  return {
    v: 1,
    createdAt:
      value.createdAt,
    id: value.id,
  };
}