import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import * as request from 'supertest';

describe('Playlists (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtToken: string;
  let playlistId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.playlist.deleteMany();
    await prisma.user.deleteMany();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'User',
        email: 'user-2@test.com',
        password: '12345',
      });

    jwtToken = loginRes.body.access_token;

    await prisma.user.findUnique({
      where: { email: 'user-2@test.com' },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/playlists (POST) - creates a playlist', async () => {
    const res = await request(app.getHttpServer())
      .post('/playlists')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'My Playlist',
        genre: 'Rock',
        musics: ['song 1', 'song 2'],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('My Playlist');
    playlistId = res.body.id;
  });

  it('/playlists (GET) - lists the user playlists', async () => {
    const res = await request(app.getHttpServer())
      .get('/playlists')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('/playlists/:id (PATCH) - updates a playlist', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/playlists/${playlistId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Updated Playlist',
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Playlist');
  });

  it('/playlists/:id (DELETE) - deletes a playlist', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/playlists/${playlistId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });
});
