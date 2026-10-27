import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'tecnico@fleetcore.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 8, maxLength: 72, format: 'password' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
