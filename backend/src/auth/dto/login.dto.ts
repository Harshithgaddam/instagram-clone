import { IsString, Length, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(3, 20)
  handle: string;

  @IsString()
  @MaxLength(128)
  password: string;
}