import { ServerRequest } from "https://deno.land/std@0.224.0/http/server.ts";

interface OpenAIChoice {
  index: number;
  message?: {
    role: string;
    content: string;
  };
  delta?: {
    content: string;
  };
  finish_reason: string | null;
}
interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage?: OpenAIUsage;
}
export class ResponseBuilder {
  // 构建标准OpenAI非流式响应
  static buildNonStreamResponse(
    modelName: string,
    fullContent: string,
    finishReason: string = "stop"
  ): Response {
    const response: OpenAIResponse = {
      id: "Chat-Nekohy",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelName,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: fullContent
          },
          finish_reason: finishReason
        }
      ]
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  // 构建标准OpenAI SSE响应数据,现在用不上
  // static buildSSEResponse(model: string, content: string): string {
  //   const response: OpenAIResponse = {
  //     id: "chatcmpl-Nekohy",
  //     object: "chat.completion.chunk",
  //     created: Math.floor(Date.now() / 1000),
  //     model: model,
  //     choices: [
  //       {
  //         index: 0,
  //         delta: {
  //           content: content
  //         },
  //         finish_reason: null
  //       }
  //     ]
  //   };
  //   return `data: ${JSON.stringify(response)}\n\n`;
  // }
  // 直接用原响应体流式响应
  static buildStreamResponse(stream: ReadableStream): Response {
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
      },
    });
  }

  static jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

}


export function streamResponse(body: ReadableStream): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Connection": "keep-alive",
      "Cache-Control": "no-cache",
    },
  });
}

export function unauthorizedResponse(message: string, status = 401): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": "Bearer",
    },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}
