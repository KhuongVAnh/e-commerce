import { UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http";
import { hashPassword, verifyPassword } from "../utils/password";
import {
  getTokenExpiryIso,
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token";
import { getShopIdBySellerId } from "./catalogClient";

type RegisterInput = {
  email?: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
};

type LoginInput = {
  email?: string;
  password?: string;
  role?: UserRole;
};

type RefreshInput = {
  refreshToken?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertRegisterInput(input: RegisterInput): Required<Pick<RegisterInput, "email" | "password" | "fullName">> & { role: UserRole } {
  const fieldErrors: Array<{ field: string; message: string }> = [];

  if (!input.email || !input.email.trim()) {
    fieldErrors.push({ field: "email", message: "Email là bắt buộc" });
  }

  if (!input.password || input.password.length < 6) {
    fieldErrors.push({ field: "password", message: "Mật khẩu tối thiểu 6 ký tự" });
  }

  if (!input.fullName || !input.fullName.trim()) {
    fieldErrors.push({ field: "fullName", message: "Họ tên là bắt buộc" });
  }

  // Chuẩn hóa role: viết hoa và trim
  const normalizedRole = input.role?.toString().trim().toUpperCase();
  
  // Kiểm tra role hợp lệ (chỉ cho phép CUSTOMER hoặc SELLER khi đăng ký)
  if (normalizedRole && normalizedRole !== UserRole.CUSTOMER && normalizedRole !== UserRole.SELLER) {
    fieldErrors.push({ 
      field: "role", 
      message: `Role không hợp lệ. Chỉ chấp nhận: ${UserRole.CUSTOMER}, ${UserRole.SELLER}` 
    });
  }

  if (fieldErrors.length > 0) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors,
      hint: "Kiểm tra lại dữ liệu nhập",
    });
  }

  return {
    email: normalizeEmail(input.email as string),
    password: input.password as string,
    fullName: (input.fullName as string).trim(),
    role: (normalizedRole as UserRole) || UserRole.CUSTOMER,
  };
}

function assertLoginInput(input: LoginInput): Required<Pick<LoginInput, "email" | "password">> & { role?: UserRole } {
  const fieldErrors: Array<{ field: string; message: string }> = [];

  if (!input.email) {
    fieldErrors.push({ field: "email", message: "Email là bắt buộc" });
  }
  if (!input.password) {
    fieldErrors.push({ field: "password", message: "Mật khẩu là bắt buộc" });
  }

  // Chuẩn hóa và verify role nếu có gửi lên
  const normalizedRole = input.role?.toString().trim().toUpperCase();
  if (normalizedRole && !Object.values(UserRole).includes(normalizedRole as UserRole)) {
    fieldErrors.push({
      field: "role",
      message: `Role không hợp lệ. Phải là một trong: ${Object.values(UserRole).join(", ")}`
    });
  }

  if (fieldErrors.length > 0) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors,
      hint: "Kiểm tra lại dữ liệu nhập",
    });
  }

  return {
    email: normalizeEmail(input.email as string),
    password: input.password as string,
    ...(normalizedRole ? { role: normalizedRole as UserRole } : {}),
  };
}

function assertRefreshTokenInput(input: RefreshInput): string {
  if (!input.refreshToken) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field: "refreshToken", message: "refreshToken là bắt buộc" }],
      hint: "Kiểm tra lại dữ liệu nhập",
    });
  }

  return input.refreshToken;
}

function serializeUserId(userId: bigint): number | string {
  const asNumber = Number(userId);
  return Number.isSafeInteger(asNumber) ? asNumber : userId.toString();
}

function toUserResponse(user: {
  id: bigint;
  email: string;
  fullName: string;
  status: string;
  createdAt?: Date;
  role: { name: string };
}) {
  return {
    id: serializeUserId(user.id),
    email: user.email,
    fullName: user.fullName,
    role: user.role.name,
    status: user.status,
    ...(user.createdAt ? { createdAt: user.createdAt.toISOString() } : {}),
  };
}

function getRefreshExpiryDate(refreshToken: string): Date {
  const expiresAt = new Date(getTokenExpiryIso(refreshToken));

  if (Number.isNaN(expiresAt.getTime())) {
    throw new HttpError(500, "Không thể xác định thời gian hết hạn refresh token", {
      code: "TOKEN_EXPIRY_INVALID",
    });
  }

  return expiresAt;
}

export async function register(input: RegisterInput) {
  const payload = assertRegisterInput(input);

  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field: "email", message: "Email đã tồn tại" }],
      hint: "Kiểm tra lại dữ liệu nhập",
    });
  }

  const role = await prisma.role.findUnique({
    where: { name: payload.role },
  });

  if (!role) {
    throw new HttpError(500, "Hệ thống chưa cấu hình role", {
      code: "ROLE_NOT_CONFIGURED",
    });
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash,
      fullName: payload.fullName,
      roleId: role.id,
    },
    include: {
      role: true,
    },
  });

  return {
    user: toUserResponse(user),
  };
}

export async function login(input: LoginInput) {
  const payload = assertLoginInput(input);

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { role: true },
  });

  if (!user) {
    throw new HttpError(401, "Sai email hoặc mật khẩu", {
      code: "INVALID_CREDENTIALS",
    });
  }

  if (payload.role && user.role.name !== payload.role) {
    throw new HttpError(401, "Vai trò không hợp lệ", {
      code: "INVALID_CREDENTIALS",
    });
  }

  const isPasswordValid = await verifyPassword(payload.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new HttpError(401, "Sai email hoặc mật khẩu", {
      code: "INVALID_CREDENTIALS",
    });
  }

  if (user.status !== "ACTIVE") {
    throw new HttpError(403, "Tài khoản không hoạt động", {
      code: "ACCOUNT_INACTIVE",
    });
  }

  let shopId: string | null = null;
  if (user.role.name === UserRole.SELLER) {
    shopId = await getShopIdBySellerId(user.id.toString());
  }

  const jwtPayload = {
    userId: user.id.toString(),
    email: user.email,
    fullName: user.fullName,
    role: user.role.name,
    ...(shopId ? { shopId } : {}),
  };

  const accessToken = signAccessToken(jwtPayload);
  const refreshToken = signRefreshToken(jwtPayload);
  const refreshExpiresAt = getRefreshExpiryDate(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    user: {
      id: serializeUserId(user.id),
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
    },
    tokens: {
      accessToken,
      refreshToken,
      accessExpiresAt: getTokenExpiryIso(accessToken),
      refreshExpiresAt: refreshExpiresAt.toISOString(),
    },
  };
}

export async function refresh(input: RefreshInput) {
  const refreshToken = assertRefreshTokenInput(input);

  let payload: { userId: string; email: string; fullName: string; role: string; shopId?: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, "Refresh token không hợp lệ", {
      code: "INVALID_REFRESH_TOKEN",
    });
  }

  let userId: bigint;
  try {
    userId = BigInt(payload.userId);
  } catch {
    throw new HttpError(401, "Refresh token không hợp lệ", {
      code: "INVALID_REFRESH_TOKEN",
    });
  }
  const tokenHash = hashRefreshToken(refreshToken);

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      userId,
      tokenHash,
      revokedAt: null,
    },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new HttpError(401, "Refresh token không hợp lệ", {
      code: "INVALID_REFRESH_TOKEN",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new HttpError(404, "Người dùng không tồn tại", {
      code: "USER_NOT_FOUND",
    });
  }

  if (user.status !== "ACTIVE") {
    throw new HttpError(403, "Tài khoản không hoạt động", {
      code: "ACCOUNT_INACTIVE",
    });
  }

  let shopId: string | null = null;
  if (user.role.name === UserRole.SELLER) {
    shopId = await getShopIdBySellerId(user.id.toString());
  }

  const jwtPayload = {
    userId: user.id.toString(),
    email: user.email,
    fullName: user.fullName,
    role: user.role.name,
    ...(shopId ? { shopId } : {}),
  };

  const newRefreshToken = signRefreshToken(jwtPayload);
  const refreshExpiresAt = getRefreshExpiryDate(newRefreshToken);

  await prisma.$transaction(async (tx) => {
    const revokeResult = await tx.refreshToken.updateMany({
      where: {
        id: storedToken.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (revokeResult.count !== 1) {
      throw new HttpError(401, "Refresh token không hợp lệ", {
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(newRefreshToken),
        expiresAt: refreshExpiresAt,
      },
    });
  });

  const accessToken = signAccessToken(jwtPayload);

  return {
    tokens: {
      accessToken,
      refreshToken: newRefreshToken,
      accessExpiresAt: getTokenExpiryIso(accessToken),
      refreshExpiresAt: refreshExpiresAt.toISOString(),
    },
  };
}

export async function logout(input: RefreshInput) {
  const refreshToken = assertRefreshTokenInput(input);

  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, "Refresh token không hợp lệ", {
      code: "INVALID_REFRESH_TOKEN",
    });
  }

  let userId: bigint;
  try {
    userId = BigInt(payload.userId);
  } catch {
    throw new HttpError(401, "Refresh token không hợp lệ", {
      code: "INVALID_REFRESH_TOKEN",
    });
  }

  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return {
    revoked: result.count > 0,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    include: { role: true },
  });

  if (!user) {
    throw new HttpError(404, "Người dùng không tồn tại", {
      code: "USER_NOT_FOUND",
    });
  }

  return {
    user: {
      id: serializeUserId(user.id),
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      status: user.status,
    },
  };
}
