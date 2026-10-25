import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User } from '../database/entities/user.entity';
import { Session } from '../database/entities/session.entity';

import type {
  AccountRecord,
  AccountWithCredential,
  AuthRepository,
  CreateAccountInput,
  CreateSessionInput,
  SessionRecord,
} from './auth.repository';

@Injectable()
export class TypeOrmAuthRepository implements AuthRepository {
  constructor(private readonly database: DatabaseService) {}

  async createAccount(input: CreateAccountInput): Promise<AccountRecord> {
    const repo = this.database.getRepository(User);

    const user = repo.create({
      handle: input.handle,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      bio: null,
      avatarSmallUrl: null,
      avatarLargeUrl: null,
      disabledAt: null,
    });

    const saved = await repo.save(user);

    return {
      id: saved.id,
      handle: saved.handle,
      displayName: saved.displayName,
      createdAt: saved.createdAt,
    };
  }

  async findAccountByHandle(
    handle: string,
  ): Promise<AccountWithCredential | null> {
    const user = await this.database
      .getRepository(User)
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.handle = :handle', { handle })
      .getOne();

    if (!user) return null;

    return {
      id: user.id,
      handle: user.handle,
      displayName: user.displayName,
      createdAt: user.createdAt,
      passwordHash: user.passwordHash,
      disabledAt: user.disabledAt,
    };
  }

  async findAccountById(id: string): Promise<AccountRecord | null> {
    const user = await this.database
  .getRepository(User)
  .createQueryBuilder('user')
  .where('user.id = :id', { id })
  .andWhere('user.disabledAt IS NULL')
  .getOne();

    if (!user) return null;

    return {
      id: user.id,
      handle: user.handle,
      displayName: user.displayName,
      createdAt: user.createdAt,
    };
  }

  async createSession(input: CreateSessionInput): Promise<void> {
    await this.database.getRepository(Session).save(
      this.database.getRepository(Session).create({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        revokedAt: null,
      }),
    );
  }

  async findSessionByTokenHash(
    hash: string,
  ): Promise<SessionRecord | null> {
    const row = await this.database
      .getRepository(Session)
      .createQueryBuilder('s')
      .innerJoin('s.user', 'u')
      .addSelect(['u.passwordHash'])
      .where('s.tokenHash = :hash', { hash })
      .select([
        's.id',
        's.userId',
        's.tokenHash',
        's.expiresAt',
        's.revokedAt',
        'u.id',
        'u.handle',
        'u.displayName',
        'u.createdAt',
        'u.passwordHash',
        'u.disabledAt',
      ])
      .getOne();

    if (!row?.user) return null;

    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      handle: row.user.handle,
      displayName: row.user.displayName,
      passwordHash: row.user.passwordHash,
      disabledAt: row.user.disabledAt,
    };
  }

  async renewSession(
    id: string,
    now: Date,
    expiresAt: Date,
  ): Promise<boolean> {
    const result = await this.database
      .getRepository(Session)
      .createQueryBuilder()
      .update(Session)
      .set({ expiresAt })
      .where('id = :id', { id })
      .andWhere('revokedAt IS NULL')
      .andWhere('expiresAt > :now', { now })
      .execute();

    return result.affected === 1;
  }

  async revokeSession(id: string): Promise<void> {
    await this.database
  .getRepository(Session)
  .createQueryBuilder()
  .update(Session)
  .set({ revokedAt: new Date() })
  .where('id = :id', { id })
  .andWhere('revokedAt IS NULL')
  .execute();
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.database.getRepository(Session)
      .createQueryBuilder()
      .update(Session)
      .set({ revokedAt: () => 'now()' })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }
}