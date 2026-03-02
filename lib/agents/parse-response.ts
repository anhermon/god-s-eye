import type { AgentConfig, AgentIntelItem } from "./types";

/**
 * Parse the LLM response into structured AgentIntelItems.
 * Handles both clean JSON and JSON embedded in markdown code blocks.
 *
 * Shared between swarm.ts (global execution) and mission.ts (targeted missions).
 */
export function parseAgentResponse(
  content: string,
  agent: AgentConfig
): AgentIntelItem[] {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    // Try to find a JSON object in the content
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!objectMatch) return [];

    const parsed = JSON.parse(objectMatch[0]);
    const items = parsed.items || parsed.data || [];

    return items
      .filter(
        (item: Record<string, unknown>) => item.title && item.confidence !== undefined
      )
      .map(
        (item: Record<string, unknown>, i: number): AgentIntelItem => ({
          id: `${agent.id}-${Date.now()}-${i}`,
          title: String(item.title || ""),
          summary: String(item.summary || ""),
          latitude: Number(item.latitude) || 0,
          longitude: Number(item.longitude) || 0,
          category: agent.category,
          subcategory: String(item.subcategory || item.classification || item.type || ""),
          confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0)),
          sourceUrl: String(item.sourceUrl || item.url || ""),
          timestamp: new Date().toISOString(),
          rawData: item as Record<string, unknown>,
        })
      );
  } catch {
    console.warn(`[Agent:${agent.id}] Failed to parse response`);
    return [];
  }
}
