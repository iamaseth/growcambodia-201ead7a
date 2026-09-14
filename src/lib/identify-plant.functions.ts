import { createServerFn } from "@tanstack/react-start";
import { findCambodiaPlant } from "@/lib/cambodia-plants";

type VisionResult = {
  common_name: string;
  scientific_name: string;
  family?: string;
  confidence: number;
  alternatives?: Array<{ common_name?: string; scientific_name: string; confidence?: number }>;
  description: string;
  visible_features?: string[];
  general_tips?: string[];
};

type PlantNetResult = {
  score: number;
  species?: {
    scientificNameWithoutAuthor?: string;
    commonNames?: string[];
    family?: { scientificNameWithoutAuthor?: string };
  };
};

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i);
  if (!match) throw new Error("Please upload a JPG, PNG, or WebP plant photo");
  const mime = match[1].toLowerCase();
  const bytes = Uint8Array.from(Buffer.from(match[2], "base64"));
  if (bytes.byteLength > 6 * 1024 * 1024) throw new Error("Photo is too large after compression");
  return { mime, bytes };
}

async function identifyWithPlantNet(imageDataUrl: string, apiKey: string) {
  const { mime, bytes } = parseDataUrl(imageDataUrl);
  const form = new FormData();
  const blob = new Blob([bytes], { type: mime === "image/webp" ? "image/jpeg" : mime });
  form.append("images", blob, "plant.jpg");
  const url = `https://my-api.plantnet.org/v2/identify/all?nb-results=4&lang=en&api-key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Pl@ntNet error ${res.status}`);
  const data = await res.json();
  const results: PlantNetResult[] = data?.results ?? [];
  if (!results.length) throw new Error("Pl@ntNet could not identify this plant");
  return results;
}

async function identifyWithVision(imageDataUrl: string): Promise<VisionResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Plant identification AI is unavailable");
  parseDataUrl(imageDataUrl);

  const prompt = `Identify the plant in this photograph. The app is Cambodia-first and Southeast-Asia focused, so prefer species that are genuinely plausible in Cambodia when visual evidence supports them. Do not force a Cambodia species when the evidence points elsewhere.

Return STRICT JSON only with:
- common_name: string
- scientific_name: string (binomial where possible, no invented species)
- family: string
- confidence: number 0-1
- alternatives: array of up to 3 objects with common_name, scientific_name, confidence
- description: 1-3 sentences describing what the plant is
- visible_features: array of 2-5 short observations actually visible in the photo
- general_tips: array of 3-5 conservative general growing tips

If the image is too poor for a species-level identification, lower confidence and identify only to the most defensible level. Never present a low-confidence guess as certain.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      }],
      response_format: { type: "json_object" },
    }),
  });
  if (res.status === 429) throw new Error("Plant identification is rate-limited; try again shortly");
  if (res.status === 402) throw new Error("AI credits are exhausted");
  if (!res.ok) throw new Error(`Plant identification AI error ${res.status}`);
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(text) as VisionResult;
  } catch {
    throw new Error("Plant identification returned an invalid result");
  }
}

async function verifyWithGbif(scientificName: string) {
  if (!scientificName) return null;
  const url = `https://api.gbif.org/v1/species/match?kingdom=Plantae&verbose=true&name=${encodeURIComponent(scientificName)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.usageKey && !data?.scientificName) return null;
    return {
      usageKey: data.usageKey ?? null,
      scientificName: data.scientificName ?? data.canonicalName ?? scientificName,
      canonicalName: data.canonicalName ?? data.species ?? scientificName,
      family: data.family ?? null,
      rank: data.rank ?? null,
      status: data.status ?? null,
      matchType: data.matchType ?? null,
      confidence: typeof data.confidence === "number" ? data.confidence / 100 : null,
      sourceUrl: data.usageKey ? `https://www.gbif.org/species/${data.usageKey}` : "https://www.gbif.org/species/search",
    };
  } catch {
    return null;
  }
}

export const identifyPlant = createServerFn({ method: "POST" })
  .inputValidator((input: { imageDataUrl: string }) => {
    if (!input?.imageDataUrl) throw new Error("Plant photo required");
    if (input.imageDataUrl.length > 8_500_000) throw new Error("Photo is too large");
    return input;
  })
  .handler(async ({ data }) => {
    let primary: VisionResult;
    let provider: "plantnet" | "vision" = "vision";
    const plantNetKey = process.env.PLANTNET_API_KEY;

    if (plantNetKey) {
      try {
        const results = await identifyWithPlantNet(data.imageDataUrl, plantNetKey);
        const top = results[0];
        const scientificName = top.species?.scientificNameWithoutAuthor ?? "";
        primary = {
          common_name: top.species?.commonNames?.[0] ?? scientificName,
          scientific_name: scientificName,
          family: top.species?.family?.scientificNameWithoutAuthor,
          confidence: top.score ?? 0,
          alternatives: results.slice(1, 4).map((r) => ({
            common_name: r.species?.commonNames?.[0],
            scientific_name: r.species?.scientificNameWithoutAuthor ?? "",
            confidence: r.score,
          })).filter((r) => r.scientific_name),
          description: "Identification supplied by Pl@ntNet and checked against the Cambodia plant knowledge layer.",
          visible_features: [],
          general_tips: [],
        };
        provider = "plantnet";
      } catch {
        primary = await identifyWithVision(data.imageDataUrl);
      }
    } else {
      primary = await identifyWithVision(data.imageDataUrl);
    }

    const gbif = await verifyWithGbif(primary.scientific_name);
    const matchedScientificName = gbif?.canonicalName ?? primary.scientific_name;
    const cambodia = findCambodiaPlant(matchedScientificName, primary.common_name) ??
      findCambodiaPlant(primary.scientific_name, primary.common_name);

    return {
      provider,
      identification: {
        commonName: primary.common_name,
        scientificName: matchedScientificName,
        family: gbif?.family ?? primary.family ?? null,
        confidence: Math.max(0, Math.min(1, primary.confidence ?? 0)),
        description: primary.description,
        visibleFeatures: primary.visible_features ?? [],
        generalTips: primary.general_tips ?? [],
        alternatives: primary.alternatives ?? [],
      },
      taxonomy: gbif,
      cambodiaProfile: cambodia ?? null,
      cambodiaCoverage: cambodia ? "curated" : "general",
    };
  });
