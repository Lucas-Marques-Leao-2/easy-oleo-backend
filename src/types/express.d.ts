import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      clerkAuth?: { userId: string };
      role?: UserRole;
    }
  }
}

export {};
