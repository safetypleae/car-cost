import type { MetadataRoute } from "next";
import { routeGuides as baseRouteGuides } from "@/data/route-guides";
import { extraRouteGuides } from "@/data/route-guides-extra";

const routeGuides = [...baseRouteGuides, ...extraRouteGuides];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://car-cost.kr",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://car-cost.kr/tools",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://car-cost.kr/fuel-cost-calculator",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://car-cost.kr/trip-cost-calculator",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://car-cost.kr/commute-cost-calculator",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://car-cost.kr/carpool-calculator",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://car-cost.kr/routes",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://car-cost.kr/guide",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://car-cost.kr/methodology",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://car-cost.kr/privacy",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://car-cost.kr/contact",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const routePages: MetadataRoute.Sitemap = routeGuides.map((route) => ({
    url: `https://car-cost.kr/routes/${route.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...routePages];
}
