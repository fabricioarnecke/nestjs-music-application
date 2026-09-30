export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET não definido. Copie o .env.example para .env e defina um valor.',
    );
  }
  return secret;
}
