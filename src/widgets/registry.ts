export const WIDGET_TYPES = ["search", "tree", "clock", "quote", "spacer", "pomodoro", "note", "hn"] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];
