export interface AccountRecord {
  id: string;
  handle: string;
  displayName: string;
  createdAt: Date;
}

export interface AccountWithCredential extends AccountRecord {
  passwordHash: string | null;
  disabledAt: Date | null;
}

export interface CreateAccountInput {
  handle: string;
  displayName: string;
  passwordHash: string;
}

export interface CreateSessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  handle: string;
  displayName: string;
  passwordHash: string | null;
  disabledAt: Date | null;
}

export interface AuthRepository {
  createAccount(input: CreateAccountInput): Promise<AccountRecord>;
  findAccountByHandle(handle: string): Promise<AccountWithCredential | null>;
  findAccountById(id: string): Promise<AccountRecord | null>;
  createSession(input: CreateSessionInput): Promise<void>;
  findSessionByTokenHash(hash: string): Promise<SessionRecord | null>;
  renewSession(
    id: string,
    now: Date,
    expiresAt: Date,
  ): Promise<boolean>;
  revokeSession(id: string): Promise<void>;
  revokeAllSessions(userId: string): Promise<void>;
}