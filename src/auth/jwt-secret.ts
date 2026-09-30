export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Copy .env.example to .env and set a value.',
    );
  }
  return secret;
}
