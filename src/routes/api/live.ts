import { createFileRoute } from "@tanstack/react-router";

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
        return json(
          {
            ok: false,
            error: "NO_LIVE_DATA_YET",
          },
          404
        );
      },
    },
  },
});
