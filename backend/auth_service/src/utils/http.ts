import { randomBytes } from "crypto";
import { Response } from "express";

const API_VERSION = process.env.API_VERSION || "v1";

type FieldError = {
  field: string;
  message: string;
};

type ErrorPayload = {
  code: string;
  details?: string[];
  fieldErrors?: FieldError[];
  hint?: string | null;
};

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: string[];
  public readonly fieldErrors: FieldError[];
  public readonly hint: string | null;

  constructor(
    statusCode: number,
    message: string,
    options: {
      code: string;
      details?: string[];
      fieldErrors?: FieldError[];
      hint?: string | null;
    },
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = options.code;
    this.details = options.details ?? [];
    this.fieldErrors = options.fieldErrors ?? [];
    this.hint = options.hint ?? null;
  }
}

export function createRequestId(): string {
  return `req_${randomBytes(4).toString("hex")}`;
}

export function sendSuccess(res: Response, options: {
  requestId: string;
  message: string;
  data: unknown;
  statusCode?: number;
}) {
  const statusCode = options.statusCode ?? 200;

  return res.status(statusCode).json({
    success: true,
    message: options.message,
    data: options.data,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
      pagination: null,
      version: API_VERSION,
      warnings: [],
    },
  });
}

export function sendError(res: Response, options: {
  requestId: string;
  statusCode: number;
  message: string;
  error: ErrorPayload;
}) {
  return res.status(options.statusCode).json({
    success: false,
    message: options.message,
    error: {
      code: options.error.code,
      details: options.error.details ?? [],
      fieldErrors: options.error.fieldErrors ?? [],
      hint: options.error.hint ?? null,
    },
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
      version: API_VERSION,
    },
  });
}
