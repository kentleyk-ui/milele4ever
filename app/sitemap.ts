import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: "https://www.milele4ever.com",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.milele4ever.com/hommages",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.milele4ever.com/souvenirs",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.milele4ever.com/accompagnement",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.milele4ever.com/mon-arbre",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://www.milele4ever.com/contact",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]
}
