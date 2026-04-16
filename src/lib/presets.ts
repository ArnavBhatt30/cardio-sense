export type Preset = {
  id: string;
  label: string;
  caption: string;
  tier: "low" | "mid" | "high";
  data: {
    age: string; gender: string; height: string; weight: string;
    ap_hi: string; ap_lo: string;
    cholesterol: string; gluc: string;
    smoke: string; alco: string; active: string;
  };
};

export const PRESETS: Preset[] = [
  {
    id: "low",
    label: "Healthy adult",
    caption: "32 yr · normal vitals",
    tier: "low",
    data: {
      age: "32", gender: "1", height: "168", weight: "62",
      ap_hi: "118", ap_lo: "75",
      cholesterol: "1", gluc: "1",
      smoke: "0", alco: "0", active: "1",
    },
  },
  {
    id: "mid",
    label: "Borderline",
    caption: "55 yr · elevated BP & cholesterol",
    tier: "mid",
    data: {
      age: "55", gender: "2", height: "175", weight: "88",
      ap_hi: "138", ap_lo: "88",
      cholesterol: "2", gluc: "2",
      smoke: "0", alco: "1", active: "0",
    },
  },
  {
    id: "high",
    label: "High-risk profile",
    caption: "63 yr · hypertensive smoker",
    tier: "high",
    data: {
      age: "63", gender: "2", height: "172", weight: "102",
      ap_hi: "168", ap_lo: "102",
      cholesterol: "3", gluc: "3",
      smoke: "1", alco: "1", active: "0",
    },
  },
];
