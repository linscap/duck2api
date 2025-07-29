FROM denoland/deno:latest

WORKDIR /app

COPY . .

RUN deno cache --node-modules-dir main.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-env", "--node-modules-dir", "main.ts"]
