import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const storedUser = {
    id: 1,
    name: 'Jane Doe',
    email: 'jane@email.com',
    password: 'stored-hash',
    role: Role.USER,
  };
  const publicUser = {
    id: 1,
    name: 'Jane Doe',
    email: 'jane@email.com',
    role: Role.USER,
  };

  let service: UsersService;
  let usersRepository: Record<
    'findByEmail' | 'create' | 'findAll' | 'findOne' | 'update' | 'remove',
    jest.Mock
  >;

  beforeEach(async () => {
    usersRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepository },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('hashes the password and does not return it', async () => {
      usersRepository.create.mockImplementation(async (data) => ({
        id: 1,
        ...data,
      }));

      const user = await service.create({
        name: 'Jane Doe',
        email: 'jane@email.com',
        password: 'secret123',
        role: Role.USER,
      });

      const saved = usersRepository.create.mock.calls[0][0];
      await expect(bcrypt.compare('secret123', saved.password)).resolves.toBe(
        true,
      );
      expect(user).toEqual(publicUser);
    });
  });

  describe('findAll', () => {
    it('never returns password hashes', async () => {
      usersRepository.findAll.mockResolvedValue([
        storedUser,
        { ...storedUser, id: 2 },
      ]);

      const users = await service.findAll();

      expect(users).toHaveLength(2);
      users.forEach((user) => expect(user).not.toHaveProperty('password'));
    });
  });

  describe('findOne', () => {
    it('returns the user without the password', async () => {
      usersRepository.findOne.mockResolvedValue(storedUser);

      await expect(service.findOne(1)).resolves.toEqual(publicUser);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      usersRepository.update.mockImplementation(async (id, data) => ({
        ...storedUser,
        ...data,
      }));
    });

    it('hashes a new password before saving it', async () => {
      usersRepository.findOne.mockResolvedValue(storedUser);

      const user = await service.update(1, { password: 'newPassword123' });

      const saved = usersRepository.update.mock.calls[0][1];
      await expect(
        bcrypt.compare('newPassword123', saved.password),
      ).resolves.toBe(true);
      expect(user).not.toHaveProperty('password');
    });

    it('leaves the password alone when it is not being changed', async () => {
      usersRepository.findOne.mockResolvedValue(storedUser);

      const user = await service.update(1, { name: 'Jane Smith' });

      expect(usersRepository.update).toHaveBeenCalledWith(1, {
        name: 'Jane Smith',
      });
      expect(user).toEqual({ ...publicUser, name: 'Jane Smith' });
    });

    it('throws NotFoundException and saves nothing when the user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.update(99, { name: 'Jane Smith' })).rejects.toThrow(
        NotFoundException,
      );
      expect(usersRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the user and returns it without the password', async () => {
      usersRepository.findOne.mockResolvedValue(storedUser);
      usersRepository.remove.mockResolvedValue(storedUser);

      await expect(service.remove(1)).resolves.toEqual(publicUser);
      expect(usersRepository.remove).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException and deletes nothing when the user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
      expect(usersRepository.remove).not.toHaveBeenCalled();
    });
  });
});
