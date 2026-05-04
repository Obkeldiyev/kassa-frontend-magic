export type ReceiverPreset = {
  id: string | number;
  name: string;
  account: string;
  inn: string;
  mfo?: string;
  MFO?: string;
};

const PRESETS_KEY = "kassa.receiverPresets";

const fallbackPresets: ReceiverPreset[] = [
  {
    id: "turin-contract",
    name: "TTPU kontrakt to'lovi",
    account: "20208000504790690008",
    inn: "301249598",
  },
];

export const getReceiverPresets = (): ReceiverPreset[] => {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    if (!stored) return fallbackPresets;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallbackPresets;
  } catch {
    return fallbackPresets;
  }
};

export const saveReceiverPresets = (presets: ReceiverPreset[]) => {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
};

export const createPresetId = () =>
  `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
