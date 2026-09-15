import {
  BadRequestException,
} from '@nestjs/common';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function rejectRepeatedQueryParameter(
  value: string | string[] | undefined,
  field: string,
): string | undefined {
  if (Array.isArray(value)) {
    throw new BadRequestException({
      message:
        `${field} must appear only once`,
      details: [
        {
          field,
          reason: 'repeated',
        },
      ],
    });
  }

  return value;
}

export function validateLimit(
  value: string | undefined,
): number {
  if (value === undefined) {
    return 10;
  }

  if (!/^\d+$/.test(value)) {
    throw new BadRequestException({
      message:
        'limit must be an integer from 1 to 50',
      details: [
        {
          field: 'limit',
          reason: 'invalid_integer',
        },
      ],
    });
  }

  const parsed = Number(value);

  if (
    parsed < 1 ||
    parsed > 50
  ) {
    throw new BadRequestException({
      message:
        'limit must be an integer from 1 to 50',
      details: [
        {
          field: 'limit',
          reason: 'out_of_range',
        },
      ],
    });
  }

  return parsed;
}

export function validateCursor(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value.length === 0) {
    throw new BadRequestException({
      message: 'cursor cannot be empty',
      details: [
        {
          field: 'cursor',
          reason: 'empty',
        },
      ],
    });
  }

  if (value.length > 1024) {
    throw new BadRequestException({
      message: 'cursor is too long',
      details: [
        {
          field: 'cursor',
          reason: 'too_long',
        },
      ],
    });
  }

  return value;
}

export function rejectLegacyPagination(
  page: string | undefined,
  offset: string | undefined,
): void {
  if (page !== undefined) {
    throw new BadRequestException({
      message:
        'page pagination is not supported',
      details: [
        {
          field: 'page',
          reason: 'unsupported',
        },
      ],
    });
  }

  if (offset !== undefined) {
    throw new BadRequestException({
      message:
        'offset pagination is not supported',
      details: [
        {
          field: 'offset',
          reason: 'unsupported',
        },
      ],
    });
  }
}

export function validateUuid(
  value: string,
  field: string,
): string {
  if (!UUID_REGEX.test(value)) {
    throw new BadRequestException({
      message:
        `${field} must be a valid UUID`,
      details: [
        {
          field,
          reason: 'invalid_uuid',
        },
      ],
    });
  }

  return value;
}
export function rejectUnknownQueryParameters(
  query: Record<string, unknown>,
  allowedFields: readonly string[],
): void {
  const unknownFields =
    Object.keys(query).filter(
      (field) =>
        !allowedFields.includes(field),
    );

  if (unknownFields.length === 0) {
    return;
  }

  throw new BadRequestException({
    message:
      `Unknown query parameter: ${unknownFields[0]}`,
    details: [
      {
        field: unknownFields[0],
        reason: 'unknown',
      },
    ],
  });
}