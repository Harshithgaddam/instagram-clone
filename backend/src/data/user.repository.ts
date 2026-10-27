// // // src/data/user.repository.ts
import { ProfileResult } from './repository.types';
import {UpdatedProfileResult} from '../users/users.service';
export interface User {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarSmallUrl: string | null;
  avatarLargeUrl: string | null;
}

export interface UserRepository {

  // Existing API
  findById(
    id: string,
  ): Promise<User | null>;

  countOriginalPosts(
    userId: string,
  ): Promise<number>;

  countFollowers(
    userId: string,
  ): Promise<number>;

  countFollowing(
    userId: string,
  ): Promise<number>;

  // C2 API
  getProfile(
    userId: string,
  ): Promise<ProfileResult | null>;
  
  updateProfile(
  userId: string,
  changes: ProfileUpdateChanges,
  expectedVersion:number,
): Promise<UpdatedProfileResult>;
}
export interface ProfileUpdateChanges {
  displayName?: string;
  bio?: string | null;
}

export interface UpdatedProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarSmallUrl: string | null;
  avatarLargeUrl: string | null;
  version: number;
}