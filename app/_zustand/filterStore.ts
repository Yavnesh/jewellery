import { create } from 'zustand';

export interface FilterState {
  priceRange: [number, number];
  jewelryTypes: string[];
  categories: string[];
  metalColors: string[];
  occasions: string[];
  collections: string[];
  purities: string[];
  genders: string[];
  availabilities: string[];
  features: string[];

  setPriceRange: (range: [number, number]) => void;
  toggleFilter: (category: keyof Omit<FilterState, 'priceRange' | 'setPriceRange' | 'toggleFilter' | 'clearAll' | 'removeFilter'>, value: string) => void;
  removeFilter: (category: keyof Omit<FilterState, 'priceRange' | 'setPriceRange' | 'toggleFilter' | 'clearAll' | 'removeFilter'>, value: string) => void;
  clearAll: () => void;
}

const initialState = {
  priceRange: [0, 20000] as [number, number],
  jewelryTypes: [],
  categories: [],
  metalColors: [],
  occasions: [],
  collections: [],
  purities: [],
  genders: [],
  availabilities: [],
  features: [],
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setPriceRange: (range) => set({ priceRange: range }),

  toggleFilter: (category, value) =>
    set((state) => {
      const currentValues = state[category] as string[];
      if (currentValues.includes(value)) {
        return { [category]: currentValues.filter((v) => v !== value) };
      } else {
        return { [category]: [...currentValues, value] };
      }
    }),

  removeFilter: (category, value) =>
    set((state) => {
      const currentValues = state[category] as string[];
      return { [category]: currentValues.filter((v) => v !== value) };
    }),

  clearAll: () => set(initialState),
}));
