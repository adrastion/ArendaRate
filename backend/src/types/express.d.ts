import { UserRole } from '@prisma/client';
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string | null;
      role: UserRole;
    };
  }
}

export {};

