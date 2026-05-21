import { create } from "zustand";

// ─── Theme Store ────────────────────────────────────────────────────
type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("theme", theme);
    }
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        localStorage.setItem("theme", newTheme);
      }
      return { theme: newTheme };
    });
  },
}));

// ─── Resume Upload Store ────────────────────────────────────────────
interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  setIsUploading: (uploading: boolean) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  isUploading: false,
  progress: 0,
  error: null,
  setIsUploading: (isUploading) => set({ isUploading }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  reset: () => set({ isUploading: false, progress: 0, error: null }),
}));

// ─── Analysis Store ─────────────────────────────────────────────────
interface AnalysisState {
  isAnalyzing: boolean;
  currentAnalysisId: string | null;
  setIsAnalyzing: (analyzing: boolean) => void;
  setCurrentAnalysisId: (id: string | null) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  isAnalyzing: false,
  currentAnalysisId: null,
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setCurrentAnalysisId: (currentAnalysisId) => set({ currentAnalysisId }),
}));