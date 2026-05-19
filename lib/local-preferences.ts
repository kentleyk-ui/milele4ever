export type SmartNotificationLevel = "all" | "priority" | "digest";

export interface SmartNotificationSettings {
  email: boolean;
  push: boolean;
  level: SmartNotificationLevel;
  dailyDigestHour: number;
}

const SMART_SETTINGS_KEY = "milele-smart-notifications";

export function loadSmartNotificationSettings(): SmartNotificationSettings {
  const fallback: SmartNotificationSettings = {
    email: true,
    push: true,
    level: "priority",
    dailyDigestHour: 9,
  };

  try {
    const raw = localStorage.getItem(SMART_SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SmartNotificationSettings>;
    return {
      email: parsed.email ?? fallback.email,
      push: parsed.push ?? fallback.push,
      level: parsed.level ?? fallback.level,
      dailyDigestHour: Number.isFinite(parsed.dailyDigestHour) ? Number(parsed.dailyDigestHour) : fallback.dailyDigestHour,
    };
  } catch {
    return fallback;
  }
}

export function saveSmartNotificationSettings(settings: SmartNotificationSettings) {
  localStorage.setItem(SMART_SETTINGS_KEY, JSON.stringify(settings));
}
