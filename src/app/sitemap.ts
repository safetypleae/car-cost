import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://car-cost.kr";

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/guide`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/methodology`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/privacy`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
