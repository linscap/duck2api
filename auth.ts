// auth.ts
import { getToken } from "./utils.ts";
import { unauthorizedResponse } from "./response.ts";

export function validateAuth(req: Request): Response | null {
  const token = getToken();
  if (!token) return null; // 无需认证
  
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== token) {
    return unauthorizedResponse("无效的客户端 API 密钥", 403);
  }
  
  return null; // 认证通过
}
