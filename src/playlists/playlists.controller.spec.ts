import { ExecutionContext, INestApplication } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as request from 'supertest';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsRepository } from './playlists.repository';
import { PlaylistsService } from './playlists.service';

describe('PlaylistsController', () => {
  const user = { id: 1, email: 'jane@email.com', role: Role.USER };

  it('protects every route with the JWT guard', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, PlaylistsController)).toEqual([
      JwtAuthGuard,
    ]);
  });

  it('passes the logged-in user to the service', async () => {
    const playlistsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [PlaylistsController],
      providers: [{ provide: PlaylistsService, useValue: playlistsService }],
    }).compile();
    const controller = moduleRef.get(PlaylistsController);
    const req = { user };
    const dto = { name: 'Heavy Rock', genre: 'Metal', musics: ['snuff'] };

    await controller.create(req, dto);
    await controller.findAll(req);
    await controller.findOne(10, req);
    await controller.update(10, req, { name: 'Heavy Rock 2025' });
    await controller.remove(10, req);

    expect(playlistsService.create).toHaveBeenCalledWith(user.id, dto);
    expect(playlistsService.findAll).toHaveBeenCalledWith(user);
    expect(playlistsService.findOne).toHaveBeenCalledWith(10, user);
    expect(playlistsService.update).toHaveBeenCalledWith(
      10,
      { name: 'Heavy Rock 2025' },
      user,
    );
    expect(playlistsService.remove).toHaveBeenCalledWith(10, user);
  });

  describe('when the database fails', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [PlaylistsController],
        providers: [
          PlaylistsService,
          {
            provide: PlaylistsRepository,
            useValue: {
              findById: jest
                .fn()
                .mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5')),
            },
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: (context: ExecutionContext) => {
            context.switchToHttp().getRequest().user = user;
            return true;
          },
        })
        .compile();

      app = moduleRef.createNestApplication({ logger: false });
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns a generic 500 without internal details', async () => {
      const res = await request(app.getHttpServer()).get('/playlists/10');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        statusCode: 500,
        message: 'Internal server error',
      });
      expect(res.text).not.toContain('ECONNREFUSED');
    });
  });
});
