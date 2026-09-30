import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    validateUser: jest.Mock;
    login: jest.Mock;
    register: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it('login checks the credentials and returns a token', async () => {
    const user = { id: 1, email: 'jane@email.com', role: Role.USER };
    authService.validateUser.mockResolvedValue(user);
    authService.login.mockResolvedValue({ access_token: 'token' });

    const result = await controller.login({
      email: 'jane@email.com',
      password: 'secret123',
    });

    expect(authService.validateUser).toHaveBeenCalledWith(
      'jane@email.com',
      'secret123',
    );
    expect(authService.login).toHaveBeenCalledWith(user);
    expect(result).toEqual({ access_token: 'token' });
  });

  it('login does not issue a token when the credentials are invalid', async () => {
    authService.validateUser.mockRejectedValue(new UnauthorizedException());

    await expect(
      controller.login({ email: 'jane@email.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('register creates the user through the service', async () => {
    const body = {
      name: 'Jane Doe',
      email: 'jane@email.com',
      password: 'secret123',
    };
    authService.register.mockResolvedValue({ access_token: 'token' });

    await expect(controller.register(body)).resolves.toEqual({
      access_token: 'token',
    });
    expect(authService.register).toHaveBeenCalledWith(body);
  });
});
