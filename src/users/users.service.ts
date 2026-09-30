import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return this.removePassword(user);
  }

  async create(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersRepository.create({
      ...data,
      password: hashedPassword,
    });

    return this.removePassword(user);
  }

  async findAll() {
    const users = await this.usersRepository.findAll();
    return users.map(this.removePassword);
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return this.removePassword(user);
  }

  async update(id: number, data: UpdateUserDto) {
    const existing = await this.usersRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = await this.usersRepository.update(id, data);
    return this.removePassword(user);
  }

  async remove(id: number) {
    const existing = await this.usersRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const user = await this.usersRepository.remove(id);
    return this.removePassword(user);
  }

  private removePassword(user: any) {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }
}
