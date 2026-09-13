import { create } from 'zustand';

export type TutorialRoleFilter = 'all' | 'factory' | 'sales' | 'inventory' | 'finance' | 'admin';

interface TutorialState {
  isOpen: boolean;
  activeStep: number;
  roleFilter: TutorialRoleFilter;
  completedSteps: number[];
  
  // Actions
  openTutorial: (stepIndex?: number) => void;
  closeTutorial: () => void;
  setActiveStep: (stepIndex: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  toggleStepCompleted: (stepIndex: number) => void;
  setRoleFilter: (filter: TutorialRoleFilter) => void;
  resetProgress: () => void;
}

const STORAGE_KEY = 'slicemart_interactive_tutorial_progress';

function loadSavedCompletedSteps(): number[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCompletedSteps(steps: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(steps));
  } catch {
    // Ignore localStorage errors
  }
}

export const useTutorialStore = create<TutorialState>((set) => ({
  isOpen: false,
  activeStep: 1,
  roleFilter: 'all',
  completedSteps: loadSavedCompletedSteps(),

  openTutorial: (stepIndex?: number) =>
    set((state) => ({
      isOpen: true,
      activeStep: stepIndex !== undefined ? stepIndex : state.activeStep,
    })),

  closeTutorial: () => set({ isOpen: false }),

  setActiveStep: (stepIndex: number) =>
    set({
      activeStep: Math.max(1, Math.min(13, stepIndex)),
    }),

  nextStep: () =>
    set((state) => ({
      activeStep: Math.min(13, state.activeStep + 1),
    })),

  prevStep: () =>
    set((state) => ({
      activeStep: Math.max(1, state.activeStep - 1),
    })),

  toggleStepCompleted: (stepIndex: number) =>
    set((state) => {
      const exists = state.completedSteps.includes(stepIndex);
      const next = exists
        ? state.completedSteps.filter((s) => s !== stepIndex)
        : [...state.completedSteps, stepIndex];
      saveCompletedSteps(next);
      return { completedSteps: next };
    }),

  setRoleFilter: (roleFilter: TutorialRoleFilter) => set({ roleFilter }),

  resetProgress: () => {
    saveCompletedSteps([]);
    set({ completedSteps: [], activeStep: 1 });
  },
}));
