import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http";

type ListUsersQuery = {
  q?: string;
  role?: string;
  status?: string;
  page?: string;
  limit?: string;
};

type UpdateUserInput = {
  fullName?: unknown;
  role?: unknown;
  status?: unknown;
};

function parsePositiveBigInt(value: unknown, field: string): bigint {
  const asText = String(value ?? "").trim();

  if (!asText || !/^\d+$/.test(asText)) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field, message: `${field} phải là số nguyên dương` }],
    });
  }

  const parsed = BigInt(asText);
  if (parsed <= 0n) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field, message: `${field} phải là số nguyên dương` }],
    });
  }

  return parsed;
}

function parseOptionalEnum<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
): T | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field, message: `${field} không hợp lệ` }],
    });
  }

  const normalized = value.trim().toUpperCase();
  if (!values.includes(normalized as T)) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field, message: `${field} phải là một trong: ${values.join(", ")}` }],
    });
  }

  return normalized as T;
}

function parsePagination(query: ListUsersQuery): { page: number; limit: number } {
  const rawPage = Number(query.page ?? 1);
  const rawLimit = Number(query.limit ?? 20);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 20;

  return { page, limit };
}

function serializeUserId(userId: bigint): number | string {
  const asNumber = Number(userId);
  return Number.isSafeInteger(asNumber) ? asNumber : userId.toString();
}

function toUserResponse(user: {
  id: bigint;
  email: string;
  fullName: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  role: { name: UserRole };
}) {
  return {
    id: serializeUserId(user.id),
    email: user.email,
    fullName: user.fullName,
    role: user.role.name,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function adminListUsers(query: ListUsersQuery) {
  const { page, limit } = parsePagination(query);
  const q = typeof query.q === "string" && query.q.trim() ? query.q.trim() : undefined;
  const role = parseOptionalEnum(query.role, Object.values(UserRole), "role");
  const status = parseOptionalEnum(query.status, Object.values(UserStatus), "status");

  const where = {
    ...(q
      ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { fullName: { contains: q, mode: "insensitive" as const } },
        ],
      }
      : {}),
    ...(status ? { status } : {}),
    ...(role ? { role: { name: role } } : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { role: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    users: users.map(toUserResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function adminGetUser(userId: string) {
  const id = parsePositiveBigInt(userId, "userId");

  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!user) {
    throw new HttpError(404, "Người dùng không tồn tại", {
      code: "USER_NOT_FOUND",
    });
  }

  return {
    user: toUserResponse(user),
  };
}

function assertUpdateUserInput(input: UpdateUserInput): {
  fullName?: string;
  role?: UserRole;
  status?: UserStatus;
} {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field: "body", message: "Body phải là object" }],
    });
  }

  const hasField = "fullName" in input || "role" in input || "status" in input;
  if (!hasField) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field: "body", message: "Cần ít nhất một trường để cập nhật" }],
    });
  }

  const fieldErrors: Array<{ field: string; message: string }> = [];

  let fullName: string | undefined;
  if (input.fullName !== undefined) {
    fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
    if (!fullName) {
      fieldErrors.push({ field: "fullName", message: "fullName không được để trống" });
    }
  }

  let role: UserRole | undefined;
  if (input.role !== undefined) {
    try {
      role = parseOptionalEnum(String(input.role), Object.values(UserRole), "role");
    } catch (err) {
      fieldErrors.push({ field: "role", message: "role không hợp lệ" });
    }
  }

  let status: UserStatus | undefined;
  if (input.status !== undefined) {
    try {
      status = parseOptionalEnum(String(input.status), Object.values(UserStatus), "status");
    } catch {
      fieldErrors.push({ field: "status", message: "status không hợp lệ" });
    }
  }

  if (fieldErrors.length > 0) {
    throw new HttpError(400, "Dữ liệu không hợp lệ", {
      code: "VALIDATION_ERROR",
      fieldErrors,
    });
  }

  return {
    ...(fullName !== undefined ? { fullName } : {}),
    ...(role !== undefined ? { role } : {}),
    ...(status !== undefined ? { status } : {}),
  };
}

export async function adminUpdateUser(userId: string, input: UpdateUserInput) {
  const id = parsePositiveBigInt(userId, "userId");
  const payload = assertUpdateUserInput(input);

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!existing) {
    throw new HttpError(404, "Người dùng không tồn tại", {
      code: "USER_NOT_FOUND",
    });
  }

  // Không cho tự hạ quyền ADMIN cuối cùng thành role khác (basic guard).
  if (existing.role.name === UserRole.ADMIN && payload.role && payload.role !== UserRole.ADMIN) {
    const adminCount = await prisma.user.count({
      where: { role: { name: UserRole.ADMIN }, status: UserStatus.ACTIVE },
    });

    if (adminCount <= 1) {
      throw new HttpError(409, "Không thể thay đổi quyền của admin cuối cùng", {
        code: "LAST_ADMIN_PROTECTED",
      });
    }
  }

  let roleId: bigint | undefined;
  if (payload.role) {
    const role = await prisma.role.findUnique({ where: { name: payload.role } });
    if (!role) {
      throw new HttpError(500, "Hệ thống chưa cấu hình role", {
        code: "ROLE_NOT_CONFIGURED",
      });
    }
    roleId = role.id;
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(payload.fullName !== undefined ? { fullName: payload.fullName } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(roleId !== undefined ? { roleId } : {}),
    },
    include: { role: true },
  });

  return {
    user: toUserResponse(user),
  };
}

export async function adminBlockUser(userId: string) {
  return adminUpdateUser(userId, { status: UserStatus.BLOCKED });
}
