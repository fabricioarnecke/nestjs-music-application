import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterAuthDto {
  @ApiProperty({
    description: 'User name',
    example: 'Jane Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'User email',
    example: 'jane@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'strongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password: string;
}
