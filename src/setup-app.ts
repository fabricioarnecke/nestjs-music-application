import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

export interface SetupAppOptions {
  // Number of reverse proxies in front of the app (1 on Render)
  trustProxyHops?: number;
}

export function getTrustProxyHops(): number {
  const hops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (!Number.isInteger(hops) || hops < 0) {
    throw new Error('TRUST_PROXY_HOPS must be a whole number, 0 or more.');
  }
  return hops;
}

// Middleware and pipes shared by main.ts and the e2e tests
export function setupApp(
  app: NestExpressApplication,
  { trustProxyHops = 0 }: SetupAppOptions = {},
) {
  // The rate limiter keys on req.ip. Behind a proxy it has to come from
  // X-Forwarded-For, but only from the entries the proxies added: trusting more
  // hops than there are, or any hop when there is no proxy, lets a client
  // pick its own IP and dodge the limit
  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
