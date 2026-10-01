import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getTrustProxyHops, setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Before the Swagger routes, so the security headers also cover the docs
  setupApp(app, { trustProxyHops: getTrustProxyHops() });

  // Closes the database connections when the platform stops the container
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Music API')
    .setDescription('API for managing users and their music playlists')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
