import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

// Polled by the hosting platform to check that the app is up. It doesn't query
// the database, so the health checks don't keep the serverless database awake
@SkipThrottle()
@ApiExcludeController()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
