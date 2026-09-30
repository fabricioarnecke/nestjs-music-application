import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

@Roles(Role.ADMIN)
class AdminOnlyController {
  handler() {}
}

class OpenController {
  handler() {}
}

function contextFor(
  controller: typeof AdminOnlyController | typeof OpenController,
  user: { role: Role },
): ExecutionContext {
  return {
    getClass: () => controller,
    getHandler: () => controller.prototype.handler,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('lets any logged-in user through when no role is required', () => {
    expect(
      guard.canActivate(contextFor(OpenController, { role: Role.USER })),
    ).toBe(true);
  });

  it('lets a user with the required role through', () => {
    expect(
      guard.canActivate(contextFor(AdminOnlyController, { role: Role.ADMIN })),
    ).toBe(true);
  });

  it('blocks a user without the required role', () => {
    expect(() =>
      guard.canActivate(contextFor(AdminOnlyController, { role: Role.USER })),
    ).toThrow(ForbiddenException);
  });
});
