import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Analysis = {
  observation: string;
  suggestions: string[];
  problems: string[];
  watch: string[];
  next_action: string;
  confidence: number;
};

const PHOTO_BUCKET = "crop-photos";

export const analyzeUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { updateId: string }) => {
    if (!input?.updateId) throw new Error("updateId required");
    return { updateId: input.updateId };
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // If an AI comment already exists, return it (cache-ish, avoid duplicate spend)
    const { data: existing } = await supabase
      .from("update_comments")
      .select("*")
      .eq("update_id", data.updateId)
      .eq("is_ai", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return existing;

    const { data: upd, error: uErr } = await supabase
      .from("timeline_updates")
      .select("*, plant_logs(title, crop_type, variety, estimated_age_years, farms(name, lat, lng))")
      .eq("id", data.updateId)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!upd) throw new Error("Update not found");

    const log = (upd as any).plant_logs;
    const farm = log?.farms;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI unavailable");

    const storedImages: string[] = Array.isArray(upd.image_urls) ? upd.image_urls.filter(Boolean) : [];
    const imageUrls: string[] = [];
    const pathsToSign: string[] = [];
    const signedIndexes: number[] = [];

    for (const entry of storedImages.slice(0, 4)) {
      if (/^https?:\/\//i.test(entry)) {
        imageUrls.push(entry);
      } else {
        signedIndexes.push(imageUrls.length);
        pathsToSign.push(entry);
        imageUrls.push("");
      }
    }

    if (pathsToSign.length) {
      const { data: signed, error: signErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrls(pathsToSign, 60 * 10);
      if (signErr) throw new Error(`Could not prepare photos for AI analysis: ${signErr.message}`);

      (signed ?? []).forEach((row, i) => {
        const idx = signedIndexes[i];
        if (idx !== undefined && row?.signedUrl) imageUrls[idx] = row.signedUrl;
      });
    }

    const usableImageUrls = imageUrls.filter(Boolean);

    const prompt = `You are an agronomist helping home growers and smallholder farmers in Cambodia.
Analyze the crop update using BOTH the written context and the attached plant photos when available.
Do not claim a disease, pest, deficiency, or treatment is certain from a photo alone. Distinguish visible observations from possible causes and lower confidence when the image is unclear or evidence is limited.
Keep recommendations practical for Cambodia's tropical conditions and appropriate to the crop and growth stage.

Return STRICT JSON with keys:
- observation (string, 1-2 sentences; state what is visibly observable when photos are present)
- suggestions (array of 2-4 short strings)
- problems (array of 0-3 short strings, possible issues only)
- watch (array of 1-3 short strings, things to monitor next)
- next_action (string, one concrete recommended action)
- confidence (number 0-1)

Crop: ${log?.crop_type ?? "unknown"}${log?.variety ? " (" + log.variety + ")" : ""}
Log: ${log?.title ?? "-"}
Growth stage: ${upd.growth_stage}
Age: ${log?.estimated_age_years ?? "unknown"} years
Farm: ${farm?.name ?? "-"} (${farm?.lat ?? ""}, ${farm?.lng ?? ""})
Farmer notes: ${upd.notes || "(none)"}
Photos attached for visual analysis: ${usableImageUrls.length}

Reply with JSON only.`;

    const messageContent: any[] = [{ type: "text", text: prompt }];
    for (const url of usableImageUrls) {
      messageContent.push({
        type: "image_url",
        image_url: { url },
      });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: messageContent }],
        response_format: { type: "json_object" },
      }),
    });
    if (res.status === 429) throw new Error("AI is rate-limited, try again in a moment");
    if (res.status === 402) throw new Error("AI credits exhausted — top up in workspace settings");
    if (!res.ok) throw new Error(`AI error ${res.status}`);

    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Analysis;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    const body = [
      parsed.observation && `**Observation:** ${parsed.observation}`,
      parsed.problems?.length && `**Possible problems:** ${parsed.problems.map((p) => "• " + p).join("\n")}`,
      parsed.suggestions?.length && `**Suggestions:** ${parsed.suggestions.map((p) => "• " + p).join("\n")}`,
      parsed.watch?.length && `**Watch:** ${parsed.watch.map((p) => "• " + p).join("\n")}`,
      parsed.next_action && `**Next action:** ${parsed.next_action}`,
    ].filter(Boolean).join("\n\n");

    // Use service role: AI-authored comments are server-generated, RLS blocks is_ai=true from users.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inserted, error } = await supabaseAdmin
      .from("update_comments")
      .insert({
        update_id: data.updateId,
        user_id: context.userId,
        author_name: "AI Agronomist",
        body,
        is_ai: true,
        confidence: parsed.confidence ?? null,
        category: "ai_analysis",
      })
      .select()
      .single();
    if (error) throw error;
    return inserted;
  });
