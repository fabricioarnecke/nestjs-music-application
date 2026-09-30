import { getJwtSecret } from './jwt-secret';

describe('getJwtSecret', () => {
  const original = process.env.JWT_SECRET;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = original;
    }
  });

  it('returns JWT_SECRET when it is set', () => {
    process.env.JWT_SECRET = 'a-strong-secret';

    expect(getJwtSecret()).toBe('a-strong-secret');
  });

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => getJwtSecret()).toThrow('JWT_SECRET is not set');
  });

  it('throws when JWT_SECRET is empty', () => {
    process.env.JWT_SECRET = '';

    expect(() => getJwtSecret()).toThrow('JWT_SECRET is not set');
  });
});
