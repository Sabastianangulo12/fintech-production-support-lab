import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { investigateTicket } from "./investigation.js";
import { renderMarkdownReport } from "./report.js";

export interface ApiServerOptions {
  port?: number;
  host?: string;
}

export function createApiServer(): Server {
  return createServer((request, response) => {
    handleRequest(request, response).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.startsWith("No support ticket found") ? 404 : 500;
      sendJson(response, status, {
        error: {
          message
        }
      });
    });
  });
}

export async function startApiServer(options: ApiServerOptions = {}): Promise<Server> {
  const port = options.port ?? 3000;
  const host = options.host ?? "127.0.0.1";
  const server = createApiServer();

  await new Promise<void>((resolve) => {
    server.listen(port, host, resolve);
  });

  return server;
}

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (!request.url || !request.method) {
    sendJson(response, 400, { error: { message: "Malformed request" } });
    return;
  }

  const url = new URL(request.url, "http://localhost");

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "fintech-production-support-lab"
    });
    return;
  }

  const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const [resource, ticketId, action, format] = segments;

  if (request.method === "GET" && resource === "tickets" && ticketId && action === "investigation") {
    const result = await investigateTicket(ticketId);

    if (format === "report") {
      sendText(response, 200, "text/markdown; charset=utf-8", renderMarkdownReport(result));
      return;
    }

    sendJson(response, 200, result);
    return;
  }

  sendJson(response, 404, {
    error: {
      message: "Route not found"
    }
  });
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  sendText(response, status, "application/json; charset=utf-8", JSON.stringify(body, null, 2));
}

function sendText(response: ServerResponse, status: number, contentType: string, body: string): void {
  response.writeHead(status, {
    "content-type": contentType
  });
  response.end(body);
}
