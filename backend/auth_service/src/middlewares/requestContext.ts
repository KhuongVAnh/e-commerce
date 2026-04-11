import { NextFunction, Request, Response } from "express";
import { createRequestId } from "../utils/http";

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingRequestId = req.header("x-request-id");
  res.locals.requestId = incomingRequestId && incomingRequestId.trim() ? incomingRequestId : createRequestId();
  next();
}
