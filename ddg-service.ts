import { generateVqdHash } from './vm.ts';
import { userAgent } from "./utils.ts";
import { CONFIG, getHash, setHash } from "./utils.ts";
import { ChatMessage } from "./types.ts";
import { errorResponse } from "./response.ts";

export class DDGService {
  private hash: string | null = null;

  async getVqdHash(): Promise<string | Response> {
    // 优先使用环境变量中的hash
    const envHash = getHash();
    if (envHash) {
      return envHash;
    }

    try {
      const response = await fetch(CONFIG.DDG_STATUS_URL, {
        method: "GET",
        headers: { 
          "User-Agent": userAgent,
          "x-vqd-accept": "1"
        }
      });


      if (!response.ok) {
        return errorResponse(`hash初始化请求失败: ${response.status}`, 502);
      }

      const hash = response.headers.get("x-vqd-hash-1");
      
      if (!hash) {
        return errorResponse(`未找到hash头部，状态码: ${response.status}`, 502);
      }

      let decryptedHash: string;
      try {
        decryptedHash = generateVqdHash(hash);
      } catch (decryptError) {
        return errorResponse(`hash解密失败: ${decryptError.message}`, 502);
      }

      if (!decryptedHash || decryptedHash.trim() === '') {
        return errorResponse(`hash解密结果为空`, 502);
      }
      setHash(decryptedHash)
      return decryptedHash;
      
    } catch (error) {
      return errorResponse(`获取hash失败: ${error.message}`, 502);
    }
  }

  async sendMessage(model: string, messages: ChatMessage[]): Promise<Response> {
    const hash = await this.getVqdHash();
    if (hash instanceof Response) {
      return hash; // 返回错误响应
    }

    const payload = {
      model,
      messages,
      canUseTools: false,
      canUseApproxLocation: false
    };

    try {
      const response = await fetch(CONFIG.DDG_CHAT_URL, {
        method: "POST",
        headers: {
          "User-Agent": userAgent,
          "x-vqd-hash-1": hash,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return errorResponse(`上游错误: ${response.status} - ${errorText}`, 502);
      }

      return response;
    } catch (error) {
      return errorResponse(`请求失败: ${error.message}`, 502);
    }
  }

  // 添加一个带重试机制的发送消息方法
  async sendMessageWithRetry(model: string, messages: ChatMessage[], maxRetries = 1): Promise<Response> {
    let lastError: Response | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        setHash(""); // 重置hash，强制重新获取
      }
      
      const result = await this.sendMessage(model, messages);
      
      if (result.ok) {
        return result;
      }
      
      lastError = result;
      
      // 如果是hash相关错误，可以重试
      if (result.status === 502) {
        continue;
      } else {
        // 其他错误直接返回
        break;
      }
    }
    
    return lastError || errorResponse("发送消息失败", 502);
  }
}
