// Slide Studio - User-Created Template Storage Manager

export interface UserSlideTemplate {
  id: string;
  name: string;
  createdAt: number;
  json: Record<string, unknown>;
}

const STORAGE_KEY = "chw_user_slide_templates";

export const UserTemplateStorage = {
  getAll: (): UserSlideTemplate[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save: (name: string, json: Record<string, unknown>): UserSlideTemplate => {
    const templates = UserTemplateStorage.getAll();
    const newTemplate: UserSlideTemplate = {
      id: `template-${Date.now()}`,
      name: name.trim() || "Untitled Template",
      createdAt: Date.now(),
      json,
    };
    const updated = [newTemplate, ...templates];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save slide template to localStorage", e);
    }
    return newTemplate;
  },

  remove: (id: string): void => {
    const templates = UserTemplateStorage.getAll();
    const filtered = templates.filter((t) => t.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to remove template from localStorage", e);
    }
  },
};
