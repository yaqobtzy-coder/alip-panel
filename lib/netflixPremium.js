import axios from "axios";

// API key sama dengan tools zone (TOOLS_ZONE_API_KEY).
const API_KEY = process.env.TOOLS_ZONE_API_KEY;
const NETFLIX_URL = "https://api.theresav.biz.id/premium/netflix";

export const NETFLIX_DEVICE_OPTIONS = [
  {
    id: "mobile_1",
    label: "1 Device — Mobile Only",
    price: 40000,
    linkKeys: ["android"],
    linkLabels: { android: "Mobile / Android" }
  },
  {
    id: "mobile_pc_2",
    label: "2 Device — Mobile + PC",
    price: 45000,
    linkKeys: ["android", "pc"],
    linkLabels: { android: "Mobile / Android", pc: "PC" }
  },
  {
    id: "mobile_pc_tv_3",
    label: "3 Device — Mobile + PC + TV",
    price: 55000,
    linkKeys: ["android", "pc", "tv"],
    linkLabels: { android: "Mobile / Android", pc: "PC", tv: "TV" }
  },
  {
    id: "pc_only",
    label: "PC Only",
    price: 50000,
    linkKeys: ["pc"],
    linkLabels: { pc: "PC" }
  },
  {
    id: "tv_only",
    label: "TV Only",
    price: 60000,
    linkKeys: ["tv"],
    linkLabels: { tv: "TV" }
  },
  {
    id: "tv_pc",
    label: "TV + PC Only",
    price: 70000,
    linkKeys: ["tv", "pc"],
    linkLabels: { tv: "TV", pc: "PC" }
  }
];

export function getNetflixOption(optionId) {
  return NETFLIX_DEVICE_OPTIONS.find((o) => o.id === String(optionId)) || null;
}

export function filterNetflixLinks(apiLinks, optionId) {
  const opt = getNetflixOption(optionId);
  if (!opt || !apiLinks) return [];
  return opt.linkKeys
    .map((key) => {
      const url = apiLinks[key];
      if (!url) return null;
      return {
        key,
        label: opt.linkLabels[key] || key,
        url
      };
    })
    .filter(Boolean);
}

export async function createNetflixToken() {
  if (!API_KEY) {
    throw new Error("TOOLS_ZONE_API_KEY belum di-set di environment.");
  }
  const res = await axios.get(NETFLIX_URL, {
    params: { apikey: API_KEY },
    timeout: 45000
  });
  return res.data;
}
