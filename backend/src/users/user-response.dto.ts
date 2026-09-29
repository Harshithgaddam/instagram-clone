// src/users/user-response.dto.ts

export class UserResponseDto {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
 avatarSmallUrl: string | null;
avatarLargeUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export class UserDetailResponseDto {
  item: UserResponseDto;
}