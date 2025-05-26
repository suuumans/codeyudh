
import { create } from "zustand";
import { axiosInstance } from "../utils/axios";
import { toast } from "react-hot-toast";


export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  solvedBy?: Array<{ id: string | number }>;
  constraints?: string;
  examples?: any[];
  hints?: string; // Add a new field for hints
  testcases: { input: string; output: string }[];
  codeSnippets?: any;
  referenceSolution?: Record<string, string>;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}


interface ProblemState {
  problems: Problem[];
  problem: Problem | null;
  solvedProblems: Problem[];
  isProblemsLoading: boolean;
  isProblemLoading: boolean;
  getAllProblems: () => Promise<void>;
  getProblemById: (id: string) => Promise<void>;
  getSolvedProblemByUser: () => Promise<void>;
}


export const useProblemStore = create<ProblemState>((set, _get) => ({
    problems: [],
    problem: null,
    solvedProblems: [],
    isProblemsLoading: false,
    isProblemLoading: false,

    getAllProblems: async () => {
        try {
            set({ isProblemsLoading: true });
            const res = await axiosInstance.get("/problems/get-all-problems");
            set({ problems: res.data.problems });
        } catch (error) {
            console.log("Error getting all problems", error);
            toast.error("Error getting all problems");
        } finally {
            set({ isProblemsLoading: false });
        }
    },

    getProblemById: async () => {
        try {
            set({ isProblemLoading: true });
            const res = await axiosInstance.get("/problems/get-problem-by-id");
            set({ problem: res.data.problem });
            toast.success(res.data.message);
        } catch (error) {
            console.log("Error getting problem by id", error);
            toast.error("Error getting problem by id");
        } finally {
            set({ isProblemLoading: false });
        }
    },

    getSolvedProblemByUser: async () => {
        try {
            set({ isProblemLoading: true });
            const res = await axiosInstance.get("/problems/get-solved-problems");
            set({ solvedProblems: res.data.problems });
            toast.success(res.data.message);
        } catch (error) {
            console.log("Error getting solved problems by user", error);
            toast.error("Error getting solved problems by user");
        } finally {
            set({ isProblemLoading: false });
        }
    },
}))