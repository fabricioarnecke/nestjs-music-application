import { getTrustProxyHops } from './setup-app';

describe('getTrustProxyHops', () => {
  const original = process.env.TRUST_PROXY_HOPS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TRUST_PROXY_HOPS;
    } else {
      process.env.TRUST_PROXY_HOPS = original;
    }
  });

  it('returns 0 when TRUST_PROXY_HOPS is not set', () => {
    delete process.env.TRUST_PROXY_HOPS;

    expect(getTrustProxyHops()).toBe(0);
  });

  it('returns the number of hops when it is set', () => {
    process.env.TRUST_PROXY_HOPS = '1';

    expect(getTrustProxyHops()).toBe(1);
  });

  it.each(['-1', '1.5', 'true', 'abc'])('throws for %p', (value) => {
    process.env.TRUST_PROXY_HOPS = value;

    expect(() => getTrustProxyHops()).toThrow(
      'TRUST_PROXY_HOPS must be a whole number',
    );
  });
});
