import { JSDOM } from 'npm:jsdom';
import { userAgent } from './utils.ts';
import crypto from 'node:crypto';

// 更详细的类型定义
interface MockMeta {
  readonly origin: string;
  readonly stack: string;
  readonly duration: number;
}

interface HashResults {
  server_hashes: string[];
  client_hashes: string[];
  signals: Record<string, unknown>;
  meta: Record<string, unknown>;
}

interface JSExecutionResult {
  server_hashes?: string[];
  client_hashes?: string[];
  signals?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}


const mockMeta: MockMeta = {
  origin: "https://duckduckgo.com", 
  stack: "",
  duration: Math.floor(Math.random() * 100) + 1
} as const;

class VqdHashGenerator {
  private static extractIIFEJSDOM(jsCode: string): HashResults {
    const results: HashResults = {
      server_hashes: [],
      client_hashes: [],
      signals: {},
      meta: {}
    };

    let dom: JSDOM | null = null;

    try {
      dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, {
        url: "https://duckduckgo.com",
        referrer: "https://duckduckgo.com",
        pretendToBeVisual: true,
        resources: "usable"
      });

      const { window } = dom;
      
      // 设置全局变量
      globalThis.window = window;
      globalThis.document = window.document;
      globalThis.navigator = window.navigator;
      
      // 设置 userAgent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: userAgent,
        configurable: true
      });
      
      // 删除 webdriver 属性
      delete (window.navigator as any).webdriver;

      // 执行 JavaScript 代码
      const result = window.eval(jsCode) as JSExecutionResult;
      
      if (result && typeof result === 'object') {
        results.server_hashes = result.server_hashes || [];
        results.client_hashes = result.client_hashes || [];
        results.signals = result.signals || {};
        results.meta = result.meta || {};
      }
      
    } catch (error) {
      console.error('JSDOM execution failed:', error);
      throw new Error(`JSDOM执行失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // 清理资源
      if (dom) {
        dom.window.close();
      }
      delete globalThis.window;
      delete globalThis.document;
      delete globalThis.navigator;
    }
    
    return results;
  }

  private static hashClientValues(mockClientHashes: string[]): string[] {
    return mockClientHashes.map((value: string): string => {
      const hash = crypto.createHash('sha256');
      hash.update(value, 'utf8');
      return hash.digest('base64');
    });
  }

  static generate(vqdHashRequest: string): string {
    if (!vqdHashRequest || typeof vqdHashRequest !== 'string') {
      throw new Error('VQD Hash 请求参数无效');
    }

    try {
      // 解码 base64
      const jsCode = atob(vqdHashRequest);
      
      // 提取和处理 hash
      const hash = this.extractIIFEJSDOM(jsCode);
      
      // 处理客户端 hash
      hash.client_hashes = this.hashClientValues(hash.client_hashes);
      
      // 合并 meta 数据
      hash.meta = {
        ...hash.meta,
        ...mockMeta
      };
      
      // 返回编码后的结果
      return btoa(JSON.stringify(hash));
      
    } catch (error) {
      console.error('generateVqdHash 执行失败:', error);
      throw new Error(`VQD Hash 生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// 导出函数版本以保持向后兼容
export function generateVqdHash(vqdHashRequest: string): string {
  return VqdHashGenerator.generate(vqdHashRequest);
}

// 导出类版本
export { VqdHashGenerator };
export type { HashResults, MockMeta, JSExecutionResult };
