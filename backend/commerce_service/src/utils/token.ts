import jwt from "jsonwebtoken";

export type JwtUserPayload = {
    userId: string;
    email: string;
    fullName: string;
    role: string;
    shopId?: string;
};

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-dev";

export function verifyAccessToken(token: string): JwtUserPayload {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as any;
    const rawUserId = decoded?.userId ?? decoded?.sub;

    if (!decoded || rawUserId === undefined) {
        throw new Error("Invalid token payload");
    }

    return {
        userId: String(rawUserId),
        email: decoded.email,
        fullName: decoded.fullName,
        role: decoded.role,
        shopId: decoded.shopId ? String(decoded.shopId) : undefined,
    };
}
