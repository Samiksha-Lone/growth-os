const minimumJwtSecretBytes = 32;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || Buffer.byteLength(secret, 'utf8') < minimumJwtSecretBytes) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 bytes.');
  }
  return secret;
}

export function validateJwtSecret(): void {
  getJwtSecret();
}
