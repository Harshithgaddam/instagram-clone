
import { Transform } from 'class-transformer';
import {
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toLowerCase()
      : value,
  )
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-z0-9_]+$/)
  handle: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @Length(1, 50)
  displayName: string;

  @IsString()
  @Length(12, 128)
  @MaxLength(128)
  password: string;
}
