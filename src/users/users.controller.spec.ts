import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ROLES_KEY } from 'src/decorators/roles.decorator';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Record<
    'create' | 'findAll' | 'findOne' | 'update' | 'remove',
    jest.Mock
  >;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = moduleRef.get(UsersController);
  });

  it('protects every route with the JWT and roles guards', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, UsersController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
  });

  it('only lets admins in', () => {
    expect(Reflect.getMetadata(ROLES_KEY, UsersController)).toEqual([
      Role.ADMIN,
    ]);
  });

  it('passes the route params and body to the service', async () => {
    const newUser = {
      name: 'Jane Doe',
      email: 'jane@email.com',
      password: 'secret123',
      role: Role.USER,
    };

    await controller.create(newUser);
    await controller.findAll();
    await controller.findOne(1);
    await controller.update(1, { name: 'Jane Smith' });
    await controller.remove(1);

    expect(usersService.create).toHaveBeenCalledWith(newUser);
    expect(usersService.findAll).toHaveBeenCalled();
    expect(usersService.findOne).toHaveBeenCalledWith(1);
    expect(usersService.update).toHaveBeenCalledWith(1, { name: 'Jane Smith' });
    expect(usersService.remove).toHaveBeenCalledWith(1);
  });
});
