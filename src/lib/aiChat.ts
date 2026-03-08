import { supabase } from '@/integrations/supabase/client';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chemistry-chat`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export interface GeneratedItem {
  type: "generate_sop" | "generate_formula" | "generate_inventory_item";
  data: Record<string, unknown>;
  text: string;
}

// Detect if user is asking to generate/add an SOP, formula, or inventory item
export function isGenerationRequest(input: string): boolean {
  const lower = input.toLowerCase();
  const generateKeywords = [
    'generate sop', 'create sop', 'add sop', 'write sop', 'make sop', 'new sop',
    'generate formula', 'create formula', 'add formula', 'write formula', 'make formula', 'new formula',
    'add chemical', 'add compound', 'add reagent', 'add to inventory', 'generate inventory',
    'create inventory', 'look up chemical', 'lookup chemical',
    'sop for', 'procedure for', 'method for',
    'formula for calculating', 'calculation for',
  ];
  return generateKeywords.some(kw => lower.includes(kw));
}

export async function generateItem(messages: ChatMessage[]): Promise<GeneratedItem | { type: "text"; text: string }> {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, type: "generate" }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: "AI request failed" }));
    throw new Error(data.error || `Error ${resp.status}`);
  }

  return resp.json();
}

export async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMessage[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, type: "chat" }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: "AI request failed" }));
    onError(data.error || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) {
    onError("No response stream");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}
