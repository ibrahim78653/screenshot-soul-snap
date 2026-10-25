import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError } from "ai";
import type { z } from "zod";

export async function generateStructured<T extends z.ZodTypeAny>(
  schema: T,
  instructions: string,
  prompt: string,
): Promise<z.infer<T>> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured.");
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      if (!res.ok) {
        const text = await res.clone().text();
        if (res.status === 402) throw new Error("AI credits are used up. Add credits to continue.");
        if (res.status === 429) throw new Error("Too many requests right now. Please try again in a minute.");
        console.error("AI gateway error", res.status, text);
      }
      return res;
    },
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions,
    prompt,
    output: Output.object({ schema }),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  } as Parameters<typeof streamText>[0]);
  try {
    const out = await result.output;
    return schema.parse(out);
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) throw new Error("The AI returned an incomplete plan. Please try again.");
    throw e;
  }
}
