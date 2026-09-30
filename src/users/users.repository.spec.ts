import { ConflictException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  const uniqueViolation = new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on the fields: (`email`)',
    { code: 'P2002', clientVersion: 'test' },
  );
  const newUser = {
    name: 'Jane Doe',
    email: 'jane@email.com',
    password: 'hash',
    role: Role.USER,
  };

  let prisma: { user: { create: jest.Mock; update: jest.Mock } };
  let repository: UsersRepository;

  beforeEach(() => {
    prisma = { user: { create: jest.fn(), update: jest.fn() } };
    repository = new UsersRepository(prisma as unknown as PrismaService);
  });

  it('create returns 409 when the email is already registered', async () => {
    prisma.user.create.mockRejectedValue(uniqueViolation);

    await expect(repository.create(newUser)).rejects.toThrow(
      new ConflictException('Email is already registered'),
    );
  });

  it('update returns 409 when the new email is already registered', async () => {
    prisma.user.update.mockRejectedValue(uniqueViolation);

    await expect(
      repository.update(1, { email: 'taken@email.com' }),
    ).rejects.toThrow(ConflictException);
  });

  it('does not hide other database errors', async () => {
    const error = new Error('connection refused');
    prisma.user.create.mockRejectedValue(error);

    await expect(repository.create(newUser)).rejects.toBe(error);
  });
});
