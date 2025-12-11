export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcrypt: {
    saltRounds: 10,
  },
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
};
