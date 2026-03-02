import { missionEmitter, type MissionEvent } from "@/lib/agents/mission-emitter";

export const dynamic = "force-dynamic";

/**
 * GET /api/agents/mission/stream — SSE endpoint for live mission events.
 * Listens on missionEmitter and pushes events to the client.
 */
export async function GET(): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const onEvent = (event: MissionEvent) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // stream closed
        }
      };

      missionEmitter.on("mission", onEvent);

      // 15s heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      // Send initial connected event
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
        );
      } catch {
        // ignore
      }

      // Cleanup when client disconnects
      const cleanup = () => {
        clearInterval(heartbeat);
        missionEmitter.off("mission", onEvent);
      };

      // The stream's cancel method handles disconnection
      const originalCancel = controller.constructor.prototype.close;
      controller.close = () => {
        cleanup();
        return originalCancel?.call(controller);
      };

      // Store cleanup for the cancel callback
      (controller as unknown as Record<string, unknown>)._cleanup = cleanup;
    },

    cancel() {
      // Called when the client disconnects
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
