import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../role.enum.js';
import { RegisterDto } from './register.dto.js';

export class AdminCreateUserDto extends RegisterDto {
  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  @IsEnum(UserRole)
  role!: UserRole;
}
