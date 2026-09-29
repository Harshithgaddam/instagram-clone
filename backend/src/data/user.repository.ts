// // // src/data/user.repository.ts

// // export interface User {
// //   id: string;
// //   handle: string;
// //   displayName: string;
// //   bio: string;
// //   avatar: {
// //     smallUrl: string;
// //     largeUrl: string;
// //   };
// // }

// // export interface UserRepository {
// //   findById(id: string): Promise<User | null>;

// //   countOriginalPosts(userId: string): Promise<number>;

// //   countFollowers(userId: string): Promise<number>;

// //   countFollowing(userId: string): Promise<number>;
// // }

// import { ProfileResult } from './repository.types';

// export interface UserRepository {
//   getProfile(
//     userId: string,
//   ): Promise<ProfileResult | null>;
// }
import { ProfileResult } from './repository.types';
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
}