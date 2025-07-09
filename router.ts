// router.ts
import { handleMeow, handleModels, handleChatCompletions } from "./handlers.ts";
import { errorResponse } from "./response.ts";


export async function router(req: Request): Promise<Response> {
  const { method } = req;
  const url = new URL(req.url);
  const pathname = url.pathname;
  
  const routes = [
    { method: "GET", path: "/v1/models", handler: handleModels },
    { method: "POST", path: "/v1/chat/completions", handler: handleChatCompletions },
    { method: "GET", path: "/", handler: handleMeow },
  ];
  
  const route = routes.find(r => r.method === method && r.path === pathname);
  
  if (route) {
    try {
      return await route.handler(req);
    } catch (error) {
      return errorResponse(`处理请求时发生错误: ${error.message}`, 500);
    }
  }
  
  return errorResponse("未找到路由", 404);
}
