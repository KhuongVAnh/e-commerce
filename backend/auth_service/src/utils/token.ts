import crypto from "crypto";
import jwt from "jsonwebtoken";

export type JwtUserPayload = {
  sub: string;
  email: string;
  fullName: string;
  role: string;
};

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-dev";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-dev";
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
