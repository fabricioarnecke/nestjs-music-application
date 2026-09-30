import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from 'src/users/users.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const password = 'secret123';
  let storedUser: {
    id: number;
    name: string;
    email: string;
    password: string;
    role: Role;
  };

  let service: AuthService;
  let usersRepository: { findByEmail: jest.Mock; create: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeAll(async () => {
    storedUser = {
      id: 1,
      name: 'Jane Doe',
      email: 'jane@email.com',
      password: await bcrypt.hash(password, 4),
      role: Role.USER,
    };
  });

  beforeEach(async () => {
    usersRepository = { findByEmail: jest.fn(), create: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('validateUser', () => {
    it('returns the user without the password when the credentials are valid', async () => {
      usersRepository.findByEmail.mockResolvedValue(storedUser);

      const user = await service.validateUser(storedUser.email, password);

      expect(user).toEqual({
        id: 1,
        name: 'Jane Doe',
        email: 'jane@email.com',
        role: Role.USER,
      });
    });

    it('rejects a wrong password', async () => {
      usersRepository.findByEmail.mockResolvedValue(storedUser);

      await expect(
        service.validateUser(storedUser.email, 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('gives the same error for an unknown email and a wrong password', async () => {
      // A different message would tell an attacker which emails are registered
      usersRepository.findByEmail.mockResolvedValueOnce(null);
      await expect(
        service.validateUser('nobody@email.com', password),
      ).rejects.toThrow('Invalid email or password');

      usersRepository.findByEmail.mockResolvedValueOnce(storedUser);
      await expect(
        service.validateUser(storedUser.email, 'wrong-password'),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('login', () => {
    it('signs a token with the user id, email and role', async () => {
      const result = await service.login({
        id: 1,
        email: 'jane@email.com',
        role: Role.USER,
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'jane@email.com',
        role: Role.USER,
      });
      expect(result).toEqual({ access_token: 'signed-token' });
    });
  });

  describe('register', () => {
    const newUser = { name: 'John Doe', email: 'john@email.com', password };

    beforeEach(() => {
      usersRepository.create.mockImplementation(async (data) => ({
        id: 2,
        ...data,
      }));
    });

    it('stores a bcrypt hash instead of the plain password', async () => {
      await service.register(newUser);

      const saved = usersRepository.create.mock.calls[0][0];
      expect(saved.password).not.toBe(password);
      await expect(bcrypt.compare(password, saved.password)).resolves.toBe(
        true,
      );
    });

    it('always creates the user with the USER role', async () => {
      // Signing up must not let anyone make themselves an admin
      await service.register({ ...newUser, role: Role.ADMIN } as any);

      expect(usersRepository.create.mock.calls[0][0].role).toBe(Role.USER);
    });

    it('returns a token for the new user', async () => {
      const result = await service.register(newUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 2,
        email: 'john@email.com',
        role: Role.USER,
      });
      expect(result).toEqual({ access_token: 'signed-token' });
    });
  });
});
