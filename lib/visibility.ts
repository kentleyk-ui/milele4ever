import type { VisibilityLevel } from "@/types/aion"

const HIERARCHY: Record<VisibilityLevel, number> = {
  intime: 4, famille: 3, amis: 2, public: 1,
}

export function canAccess(memberLevel: VisibilityLevel, contentLevel: VisibilityLevel): boolean {
  return HIERARCHY[memberLevel] >= HIERARCHY[contentLevel]
}

export function getAccessibleLevels(memberLevel: VisibilityLevel): VisibilityLevel[] {
  const threshold = HIERARCHY[memberLevel]
  return (Object.entries(HIERARCHY) as [VisibilityLevel, number][])
    .filter(([, rank]) => rank <= threshold)
    .map(([level]) => level)
}

export function getVisibilityLabel(level: VisibilityLevel): string {
  const labels: Record<VisibilityLevel, string> = {
    intime: "Intime",
    famille: "Famille",
    amis: "Amis",
    public: "Public",
  }
  return labels[level] ?? level
}

export function getVisibilityColor(level: VisibilityLevel): string {
  const colors: Record<VisibilityLevel, string> = {
    intime: "#8B5CF6",
    famille: "#F59E0B",
    amis: "#3B82F6",
    public: "#10B981",
  }
  return colors[level] ?? "#888"
}
