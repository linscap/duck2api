// handlers.ts
import { CONFIG } from "./utils.ts";
import { ChatCompletionRequest, ModelInfo } from "./types.ts";
import { errorResponse, ResponseBuilder } from "./response.ts";
import { validateAuth } from "./auth.ts";
import { DDGService } from "./ddg-service.ts";

const ddgService = new DDGService();

export async function handleModels(req: Request): Promise<Response> {
  const data: ModelInfo[] = CONFIG.MODELS.map((id) => ({
    id,
    object: "model",
    created: 0,
    owned_by: "ddg",
  }));
  
  return ResponseBuilder.jsonResponse({ object: "list", data });
}

export async function handleChatCompletions(req: Request): Promise<Response> {
  // 认证检查
  const authError = validateAuth(req);
  if (authError) return authError;

  // 解析请求体
  let body: ChatCompletionRequest;
  try {
    const bodyText = await req.text();
    body = JSON.parse(bodyText);
  } catch {
    return errorResponse("请求 JSON 解析失败", 400);
  }

  // 验证模型
  const { model, messages, stream = false } = body;
  if (!CONFIG.MODELS.includes(model)) {
    return errorResponse(`模型 ${model} 未找到`, 404);
  }

  // 发送到DDG
  const ddgResponse = await ddgService.sendMessageWithRetry(model, messages);
  if (!ddgResponse.ok) {
    return ddgResponse;
  }

  return ResponseBuilder.buildResponse(ddgResponse.body!,stream,model);
}

export const handleMeow = async (request: Request): Promise<Response> => {
    return new Response("Meow~", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
};