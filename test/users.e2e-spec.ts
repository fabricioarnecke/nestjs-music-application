import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin@test.com',
        password: await bcrypt.hash('admin', 10),
        role: 'ADMIN',
      },
    });

    const res = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@test.com',
      password: 'admin',
    });

    jwtToken = res.body.access_token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  it('/users (POST) - creates a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'User Test',
        email: 'user@test.com',
        password: '12345',
        role: 'USER',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('user@test.com');
    expect(res.body.role).toBe('USER');
  });

  it('/users (POST) - returns 409 for an email that is already registered', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Another User',
        email: 'user@test.com',
        password: '12345',
        role: 'USER',
      });

    expect(res.status).toBe(409);
  });

  it('/users (GET) - lists all users', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  let createdUserId: number;

  it('/users (POST) - creates a user for the next tests', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'User Test 2',
        email: 'user2@test.com',
        password: '12345',
        role: 'USER',
      });

    expect(res.status).toBe(201);
    createdUserId = res.body.id;

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('user2@test.com');
  });

  it('/users/:id (GET) - gets a user by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', createdUserId);
    expect(res.body).not.toHaveProperty('password');
  });

  it('/users/:id (PATCH) - updates a user', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ name: 'Updated User Test' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated User Test');
  });

  it('/users/:id (DELETE) - deletes a user', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', createdUserId);
  });

  it('/users/:id (GET) - returns 404 after the user is deleted', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(404);
  });

  it('/users/:id (DELETE) - also deletes the user playlists', async () => {
    const owner = await prisma.user.create({
      data: {
        name: 'Playlist Owner',
        email: 'owner@test.com',
        password: 'not-used',
        role: 'USER',
        playlists: {
          create: [{ name: 'Heavy Rock', genre: 'Metal', musics: ['snuff'] }],
        },
      },
    });

    const res = await request(app.getHttpServer())
      .delete(`/users/${owner.id}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(await prisma.playlist.count({ where: { user_id: owner.id } })).toBe(
      0,
    );
  });
});
