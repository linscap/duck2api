export const CONFIG = {
  PORT: 8000,
  DDG_STATUS_URL: "https://duckduckgo.com/duckchat/v1/status",
  DDG_CHAT_URL: "https://duckduckgo.com/duckchat/v1/chat",
  MODELS: [
    "gpt-4o-mini",
    "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    "claude-3-5-haiku-latest",
    "o4-mini",
    "mistralai/Mistral-Small-24B-Instruct-2501",
  ],
};

export const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";

export const getToken = (): string | null => {
  return Deno.env.has("TOKEN") ? "Bearer " + Deno.env.get("TOKEN") : null;
};

export const getHash = (): string | undefined => {
  return Deno.env.get("HASH");
};

export const clearHash = (): void => {
  return Deno.env.set("HASH", "");
};
