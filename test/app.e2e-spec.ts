import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from 'src/app.module';
import { setupApp } from 'src/setup-app';
import request from 'supertest';

async function createApp(trustProxyHops: number) {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  setupApp(app, { trustProxyHops });
  await app.init();
  return app;
}

// A login that always fails, sent as if it came through a proxy
const wrongLogin = (app: NestExpressApplication, forwardedFor: string) =>
  request(app.getHttpServer())
    .post('/auth/login')
    .set('X-Forwarded-For', forwardedFor)
    .send({ email: 'nobody@test.com', password: 'wrong-password' });

describe('App (e2e)', () => {
  describe('without a proxy', () => {
    let app: NestExpressApplication;

    beforeAll(async () => {
      app = await createApp(0);
    });

    afterAll(async () => {
      await app.close();
    });

    it('/health (GET) - reports that the app is up', async () => {
      const res = await request(app.getHttpServer()).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });

    it('sends the security headers', async () => {
      const res = await request(app.getHttpServer()).get('/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers).not.toHaveProperty('x-powered-by');
    });

    it('ignores X-Forwarded-For, so a client cannot dodge the rate limit', async () => {
      // A different fake IP on every attempt; the limit on login is 5 per minute
      for (let attempt = 1; attempt <= 5; attempt++) {
        const res = await wrongLogin(app, `203.0.113.${attempt}`);
        expect(res.status).toBe(401);
      }

      const res = await wrongLogin(app, '203.0.113.6');
      expect(res.status).toBe(429);
    });
  });

  describe('behind one proxy', () => {
    let app: NestExpressApplication;

    beforeAll(async () => {
      app = await createApp(1);
    });

    afterAll(async () => {
      await app.close();
    });

    it('rate limits each client IP separately', async () => {
      for (let attempt = 1; attempt <= 5; attempt++) {
        const res = await wrongLogin(app, '203.0.113.10');
        expect(res.status).toBe(401);
      }
      const blocked = await wrongLogin(app, '203.0.113.10');
      expect(blocked.status).toBe(429);

      const otherClient = await wrongLogin(app, '203.0.113.20');
      expect(otherClient.status).toBe(401);
    });

    it('uses the IP added by the proxy, not one the client sent', async () => {
      // The client prepends a fake IP; the proxy appends the real one
      const res = await wrongLogin(app, '198.51.100.1, 203.0.113.10');

      expect(res.status).toBe(429);
    });
  });
});
