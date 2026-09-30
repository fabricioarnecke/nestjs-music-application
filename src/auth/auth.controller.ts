import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginAuthDto } from './dtos/login-auth.dto';
import { RegisterAuthDto } from './dtos/register-auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in' })
  @ApiCreatedResponse({
    description: 'Logged in; returns a JWT',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  async login(@Body() body: LoginAuthDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Sign up as a new user' })
  @ApiCreatedResponse({
    description: 'User created; returns a JWT',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  async register(@Body() body: RegisterAuthDto) {
    return this.authService.register(body);
  }
}
