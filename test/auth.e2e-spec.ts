import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import request from 'supertest';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const account = {
    name: 'Jane Doe',
    email: 'jane@test.com',
    password: 'secret123',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Same validation as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  it('/auth/register (POST) - creates an account and returns a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(account);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('access_token');
  });

  it('/auth/register (POST) - returns 409 for an email that is already registered', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(account);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email is already registered');
  });

  it('/auth/register (POST) - rejects a role sent in the body', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...account, email: 'other@test.com', role: 'ADMIN' });

    expect(res.status).toBe(400);
  });

  it('/auth/login (POST) - logs in with the new account', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: account.email, password: account.password });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('access_token');
  });

  it('/auth/login (POST) - returns 401 for a wrong password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: account.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('/auth/login (POST) - returns 429 after too many attempts', async () => {
    const wrongLogin = () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: account.email, password: 'wrong-password' });

    // The limit is 5 per minute and the tests above already used some of them
    let res = await wrongLogin();
    for (let attempt = 1; attempt < 6 && res.status !== 429; attempt++) {
      res = await wrongLogin();
    }

    expect(res.status).toBe(429);
    expect(res.headers).toHaveProperty('retry-after');
  });
});
