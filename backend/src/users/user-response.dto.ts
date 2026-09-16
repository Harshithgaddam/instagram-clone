// src/users/user-response.dto.ts

export class UserResponseDto {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatar: {
    smallUrl: string;
    largeUrl: string;
  };
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export class UserDetailResponseDto {
  item: UserResponseDto;
}