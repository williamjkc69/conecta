import { create } from "zustand";

interface InterviewState {
  reportData: any | null;
  setReportData: (data: any) => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  reportData: null,
  setReportData: (data) => set({ reportData: data })
}));
