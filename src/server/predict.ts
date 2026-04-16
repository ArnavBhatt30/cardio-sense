import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PredictInput = z.object({
  age: z.number().min(1).max(120),
  gender: z.number().int().min(1).max(2),
  height: z.number().min(50).max(250),
  weight: z.number().min(20).max(400),
  ap_hi: z.number().int().min(50).max(260),
  ap_lo: z.number().int().min(30).max(200),
  cholesterol: z.number().int().min(1).max(3),
  gluc: z.number().int().min(1).max(3),
  smoke: z.number().int().min(0).max(1),
  alco: z.number().int().min(0).max(1),
  active: z.number().int().min(0).max(1),
});

export const predictRisk = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => PredictInput.parse(data))
  .handler(async ({ data }) => {
    const base = process.env.FLASK_API_URL;
    if (!base) {
      return { ok: false as const, error: "FLASK_API_URL is not configured." };
    }
    const url = base.replace(/\/+$/, "") + "/predict";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Prediction backend error", res.status, text);
        return { ok: false as const, error: `Backend returned ${res.status}` };
      }
      const json = (await res.json()) as {
        probability?: number;
        prediction?: number;
        confidence?: number;
      };
      const probability =
        typeof json.probability === "number"
          ? json.probability
          : json.prediction === 1
            ? null
            : null;
      if (probability === null && typeof json.prediction !== "number") {
        return { ok: false as const, error: "Invalid response from backend." };
      }
      return {
        ok: true as const,
        probability: probability ?? (json.prediction === 1 ? 1 : 0),
        prediction: json.prediction ?? (probability && probability > 0.5 ? 1 : 0),
        confidence: json.confidence ?? null,
      };
    } catch (e) {
      console.error("Prediction request failed", e);
      return { ok: false as const, error: "Backend unreachable." };
    }
  });
