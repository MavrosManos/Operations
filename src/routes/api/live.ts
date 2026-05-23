import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/live")({
  server: {
    handlers: {
      GET: async () => {
        const latest = await env.AUTOWAY_OPS_KV.get("latest:json", "json");

        if (!latest) {
          return json(
            {
              ok: false,
              error: "NO_LIVE_DATA_YET",
            },
            404
          );
        }

        return json(latest);
      },
    },
  },
});
