import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@tld/shared';
import { config } from './config.js';
import { HttpError } from './http.js';

export interface TokenPayload {
  id: number;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'احراز هویت لازم است');
  try {
    req.user = jwt.verify(header.slice(7), config.jwtSecret) as TokenPayload;
    next();
  } catch {
    throw new HttpError(401, 'توکن نامعتبر است');
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) throw new HttpError(403, 'دسترسی مجاز نیست');
    next();
  };
}
