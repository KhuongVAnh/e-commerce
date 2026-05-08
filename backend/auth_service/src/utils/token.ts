import crypto from "crypto";
import jwt from "jsonwebtoken";

export type JwtUserPayload = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  shopId?: string;
};

function getRequiredEnv(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`[auth_service] Missing required environment variable: ${name}`);
  }

  return value;
}

const ACCESS_TOKEN_SECRET = getRequiredEnv("JWT_ACCESS_SECRET");
const REFRESH_TOKEN_SECRET = getRequiredEnv("JWT_REFRESH_SECRET");

if (ACCESS_TOKEN_SECRET === REFRESH_TOKEN_SECRET) {
  throw new Error("[auth_service] JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different");
}

const ACCESS_TOKEN_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN || "1h") as jwt.SignOptions["expiresIn"];
const REFRESH_TOKEN_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

export function signAccessToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function signRefreshToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): JwtUserPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtUserPayload;
}

export function verifyRefreshToken(token: string): JwtUserPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtUserPayload;
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getTokenExpiryIso(token: string): string {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === "string" || !decoded.exp) {
    return new Date().toISOString();
  }

  return new Date(decoded.exp * 1000).toISOString();
}
