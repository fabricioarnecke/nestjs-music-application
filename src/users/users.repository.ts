import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: CreateUserDto) {
    return this.prisma.user.create({ data }).catch(rethrowEmailConflict);
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  update(id: number, data: Partial<UpdateUserDto>) {
    return this.prisma.user
      .update({ where: { id }, data })
      .catch(rethrowEmailConflict);
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}

// P2002 is Prisma's unique constraint error, and email is the only unique field of User
function rethrowEmailConflict(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException('Email is already registered');
  }
  throw error;
}
