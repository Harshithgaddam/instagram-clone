// src/data/user.repository.ts

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

  countOriginalPosts(userId: string): Promise<number>;

  countFollowers(userId: string): Promise<number>;

  countFollowing(userId: string): Promise<number>;
}