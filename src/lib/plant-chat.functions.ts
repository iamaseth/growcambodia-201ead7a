import { createServerFn } from "@tanstack/react-start";

type ChatMessage = { role: "user" | "assistant"; content: string };

export const askPlantAI = createServerFn({ method: "POST" })
  .inputValidator((input: { plant: any; messages: ChatMessage[] }) => {
    if (!input?.plant) throw new Error("Plant context required");
    if (!Array.isArray(input.messages) || !input.messages.length) throw new Error("Question required");
    return { plant: input.plant, messages: input.messages.slice(-12) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Plant AI is unavailable");
    const context = JSON.stringify(data.plant).slice(0, 12000);
    const system = `You are Grow Cambodia's plant assistant. Continue a conversation about a plant that has already been identified. Keep the identified plant and prior conversation in context so the user does not need to repeat them. Give practical home-gardening answers, with Cambodia and Southeast Asian tropical conditions in mind when relevant. Distinguish what is known from what is uncertain. If the identification confidence is weak, say when the answer depends on the exact species. Be concise but useful. Do not re-identify the plant unless the user asks or new evidence creates a reason to question it.\n\nPlant identification and Cambodia profile:\n${context}`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });
    if (res.status === 429) throw new Error("Plant AI is busy; try again shortly");
    if (res.status === 402) throw new Error("AI credits are exhausted");
    if (!res.ok) throw new Error(`Plant AI error ${res.status}`);
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Plant AI returned no answer");
    return { content: String(content) };
  });
