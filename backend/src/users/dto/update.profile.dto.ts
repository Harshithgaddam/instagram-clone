import { Transform } from 'class-transformer';
import {
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  IsInt,
   Min,
} from 'class-validator';

export class UpdateProfileDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(160)
  bio?: string;

  @IsInt()
  @Min(1)
  version: number;
}