export interface ChatMessage {
    role: "user" | "assistant" | "system" | string;
    content: string;
  }
  
  export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    stream?: boolean;
  }
  
  export interface ModelInfo {
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }
  
  export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    object?: string;
  }
  