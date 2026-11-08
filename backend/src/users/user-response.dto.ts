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
  version: number;
  isPrivate: boolean;
  relationshipStatus: string | null;
}

export class UserDetailResponseDto {
  item: UserResponseDto;
}