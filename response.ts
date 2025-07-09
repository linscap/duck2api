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
  private static log(
    level: "info" | "warn" | "error",
    message: string,
    data?: any
  ) {
    const timestamp = new Date().toISOString();
    const logData = data ? ` | Data: ${JSON.stringify(data)}` : "";
    console[level](`[${timestamp}] [ResponseBuilder] ${message}${logData}`);
  }

  // 构建非流式响应
  static buildNonStreamResponse(
    modelName: string,
    fullContent: string,
    finishReason: string = "stop"
  ): Response {
    this.log("info", "Building non-stream response", {
      modelName,
      contentLength: fullContent.length,
    });

    const response = {
      id: "Chat-Nekohy",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelName,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: fullContent },
          finish_reason: finishReason,
        },
      ],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 构建SSE数据块
  static buildSSEChunk(
    model: string,
    content: string,
    isFinish: boolean = false
  ): string {
    const response = {
      id: "chatcmpl-Nekohy",
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          delta: isFinish ? {} : { content },
          finish_reason: isFinish ? "stop" : null,
        },
      ],
    };

    const chunk = `data: ${JSON.stringify(response)}\n\n`;
    return isFinish ? chunk + "data: [DONE]\n\n" : chunk;
  }

  // 主要响应构建方法
  static buildResponse(
    readableStream: ReadableStream,
    stream: boolean = false,
    modelName: string = "default"
  ): Response {
    this.log("info", "Building response", { stream, modelName });

    const transformedStream = new ReadableStream({
      start: async (controller) => {
        const reader = readableStream.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let chunkCount = 0;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const content = this.extractContent(chunk);

            if (content) {
              chunkCount++;
              fullContent += content;

              if (stream) {
                const sseChunk = this.buildSSEChunk(modelName, content);
                controller.enqueue(new TextEncoder().encode(sseChunk));
              }
            }
          }

          this.log("info", "Stream processing completed", {
            chunkCount,
            totalLength: fullContent.length,
            stream,
          });

          if (stream) {
            // 发送结束标记
            const finishChunk = this.buildSSEChunk(modelName, "", true);
            controller.enqueue(new TextEncoder().encode(finishChunk));
          } else {
            // 发送完整响应
            const response = this.buildNonStreamResponse(
              modelName,
              fullContent
            );
            const responseText = await response.text();
            controller.enqueue(new TextEncoder().encode(responseText));
          }

          controller.close();
        } catch (error) {
          this.log("error", "Stream processing failed", {
            error: error.message,
          });
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    const headers = stream
      ? {
          "Content-Type": "text/event-stream",
          Connection: "keep-alive",
          "Cache-Control": "no-cache",
        }
      : { "Content-Type": "application/json" };

    return new Response(transformedStream, { status: 200, headers });
  }

  // 提取SSE数据中的内容
  private static extractContent(chunk: string): string {
    let content = "";
    const lines = chunk.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("data: ") && !trimmedLine.includes("[DONE]")) {
        try {
          const jsonStr = trimmedLine.slice(6).trim();
          if (jsonStr) {
            const data = JSON.parse(jsonStr);
            if (data.message && typeof data.message === "string") {
              content += data.message;
            }
          }
        } catch (e) {
          this.log("warn", "Failed to parse SSE data", {
            line: trimmedLine,
            error: e.message,
          });
        }
      }
    }

    return content;
  }

  // 通用JSON响应
  static jsonResponse(data: unknown, status = 200): Response {
    this.log("info", "Creating JSON response", { status });
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export function streamResponse(body: ReadableStream): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
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
  return ResponseBuilder.jsonResponse({ error: message }, status);
}
