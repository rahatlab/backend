import { SignJWT, jwtVerify } from "jose";

export interface ApiJwtPayload {
  sub: string;
  name: string;
  image?: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signApiJwt(payload: ApiJwtPayload): Promise<string> {
  return new SignJWT({ name: payload.name, image: payload.image })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(secretKey());
}

export async function verifyApiJwt(token: string): Promise<ApiJwtPayload> {
  const { payload } = await jwtVerify(token, secretKey());
  if (!payload.sub) throw new Error("Token has no subject");
  return {
    sub: payload.sub,
    name: typeof payload.name === "string" ? payload.name : "",
    image: typeof payload.image === "string" ? payload.image : undefined,
  };
}
