// main.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { router } from "./router.ts";
import { CONFIG } from "./utils.ts";

console.log(`🚀 服务器启动在端口 ${CONFIG.PORT}`);

serve((req: Request) => router(req), { port: CONFIG.PORT });
