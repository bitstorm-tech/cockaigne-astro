import * as jose from "jose";

const JWT_SECRET = jose.base64url.decode(import.meta.env.JWT_SECRET);

export interface JwtPayload {
  sub: string;
  isDealer: boolean;
  isProUser: boolean;
}

export async function encryptJwt(userId: string, isDealer: boolean, isProUser: boolean): Promise<string> {
  const payload = {
    sub: userId,
    isDealer,
    isProUser,
  };

  return await new jose.SignJWT(payload).setProtectedHeader({ alg: "HS512", typ: "JWT" }).sign(JWT_SECRET);
}

export async function decryptJwt(jwt: string): Promise<JwtPayload | undefined> {
  try {
    const { payload } = await jose.jwtVerify<JwtPayload>(jwt, JWT_SECRET);
    return payload;
  } catch {
    return;
  }
}
