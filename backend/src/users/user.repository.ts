import { users } from '../data/fixtures';

export interface User {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatar: {
    smallUrl: string;
    largeUrl: string;
  };
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
}

export class FixtureUserRepository
  implements UserRepository
{
  async findById(id: string): Promise<User | null> {
    const user = users.find(
      (item) => item.id === id,
    );

    return user ?? null;
  }
}