import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET phải có ít nhất 32 ký tự");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  role: "admin" | "customer";
}

export const generateAccessToken = async (
  payload: TokenPayload
): Promise<string> => {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
};

export const verifyAccessToken = async (
  token: string
): Promise<TokenPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.userId !== "string" ||
      (payload.role !== "admin" && payload.role !== "customer")
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role,
    };
  } catch {
    return null;
  }
};

export const getCurrentUser = async (): Promise<TokenPayload | null> => {
  const cookieStore = await cookies();

  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return null;
  }

  return verifyAccessToken(token);
};

export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();

  return user?.role === "admin";
};
