import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';

import { TypeOrmAuthRepository } from './typeorm-auth.repository';
import type { AccountRecord } from './auth.repository';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface CreatedSession {
  token: string;
  expiresAt: Date;
  account: AccountRecord;
}

@Injectable()
export class AuthService {
  constructor(private readonly repository: TypeOrmAuthRepository) {}
  private readonly dummyPasswordHash = argon2.hash(
  randomBytes(32).toString('hex'),
  { type: argon2.argon2id },
);

  async register(dto: RegisterDto): Promise<{ item: AccountRecord }> {
    const handle = dto.handle.trim().toLowerCase();
    const displayName = dto.displayName.trim();
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    try {
      const account = await this.repository.createAccount({
        handle,
        displayName,
        passwordHash,
      });

      return { item: account };
    } catch (error) {
      // PostgreSQL's unique constraint handles concurrent attempts.
      if (
        typeof error === 'object' &&
        error !== null &&
        'driverError' in error &&
        (error as { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new ConflictException('Handle is unavailable');
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<CreatedSession> {
    const handle = dto.handle.trim().toLowerCase();
    const account = await this.repository.findAccountByHandle(handle);

    // Same public failure for unknown account and wrong password.
    const passwordHash =
  account?.passwordHash ?? await this.dummyPasswordHash;

const passwordMatches = await argon2.verify(
  passwordHash,
  dto.password,
);
       

    if (!account || !passwordMatches ) {
      throw new UnauthorizedException('Invalid credentials');
    }

      if (account.disabledAt) {
    await this.repository.reactivateAccount(account.id);
     }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await this.repository.createSession({
      userId: account.id,
      tokenHash,
      expiresAt,
    });

    return {
      token,
      expiresAt,
      account: {
        id: account.id,
        handle: account.handle,
        displayName: account.displayName,
        createdAt: account.createdAt,
      },
    };
  }

  async verifyToken(token: string) {
    const session = await this.repository.findSessionByTokenHash(
      this.hashToken(token),
    );

    if (!session) return null;

    if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    if (session.disabledAt) {
      await this.repository.revokeAllSessions(session.userId);
      return null;
    }

    return {
      sessionId: session.id,
      userId: session.userId,
      handle: session.handle,
      displayName: session.displayName,
    };8
  }

  async currentAccount(userId: string): Promise<{ item: AccountRecord }> {
    const account = await this.repository.findAccountById(userId);

    if (!account) {
      throw new UnauthorizedException('Authentication required');
    }

    return { item: account };
  }

  async renewSession(sessionId: string): Promise<Date> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    const renewed = await this.repository.renewSession(
      sessionId,
      now,
      expiresAt,
    );

    if (!renewed) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return expiresAt;
  }

  async logout(sessionId: string): Promise<void> {
    await this.repository.revokeSession(sessionId);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}