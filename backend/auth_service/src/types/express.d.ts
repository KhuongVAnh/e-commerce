import "express";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        userId: string;
        email: string;
        fullName: string;
        role: string;
      };
    }
  }
}

export {};
