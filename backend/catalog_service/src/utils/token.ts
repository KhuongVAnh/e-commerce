import jwt from "jsonwebtoken";

export type JwtUserPayload = {
    userId: bigint;
    email: string;
    fullName: string;
    role: string;
};

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-dev";

export function verifyAccessToken(token: string): JwtUserPayload {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as any;

    if (!decoded || decoded.userId === undefined || decoded.sub === undefined) {
        throw new Error("Invalid token payload");
    }

    let userId: bigint;

    try {
        userId = BigInt(decoded.userId || decoded.sub);
    } catch {
        throw new Error("Invalid userId in token");
    }

    return {
        userId,
        email: decoded.email,
        fullName: decoded.fullName,
        role: decoded.role,
    };
}
