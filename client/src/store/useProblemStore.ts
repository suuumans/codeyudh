
// import { create } from "zustand";
// import { axiosInstance } from "../utils/axios";
// import { toast } from "react-hot-toast";


// export interface Problem {
//   id: string;
//   title: string;
//   description: string;
//   difficulty: 'EASY' | 'MEDIUM' | 'HARD';
//   tags: string[];
//   solvedBy?: Array<{ id: string | number }>;
//   constraints?: string;
//   examples?: any[];
//   hints?: string; // Add a new field for hints
//   testcases: { input: string; output: string }[];
//   codeSnippets?: any;
//   referenceSolution?: Record<string, string>;
//   userId?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
// }


// interface ProblemState {
//   problems: Problem[];
//   problem: Problem | null;
//   solvedProblems: Problem[];
//   isProblemsLoading: boolean;
//   isProblemLoading: boolean;
//   getAllProblems: () => Promise<void>;
//   getProblemById: (id: string) => Promise<void>;
//   getSolvedProblemByUser: () => Promise<void>;
// }


// export const useProblemStore = create<ProblemState>((set, _get) => ({
//     problems: [],
//     problem: null,
//     solvedProblems: [],
//     isProblemsLoading: false,
//     isProblemLoading: false,

//     getAllProblems: async () => {
//         try {
//             set({ isProblemsLoading: true });
//             const res = await axiosInstance.get("/problems/get-all-problems");
//             console.log("Problems API response:", res.data);

//             const problemsArray = Array.isArray(res.data) ? res.data : 
//                 (res.data?.problems && Array.isArray(res.data.problems)) ? res.data.problems : [];

//             console.log("Problems data structure:", {
//                 isArray: Array.isArray(res.data),
//                 hasProblems: Boolean(res.data?.problems),
//                 problemsIsArray: Array.isArray(res.data?.problems),
//                 finalArray: problemsArray
//             });
//             set({ 
//                 problems: problemsArray
//             });

//             if (problemsArray.length > 0) {
//                 toast.success("Problems fetched successfully");
//             }
//         } catch (error) {
//             console.log("Error getting all problems", error);
//             toast.error("Error getting all problems");
//             // Optionally set problems to empty array only on error
//             set({ problems: [] });
//         } finally {
//             set({
//                 isProblemsLoading: false,
//             });
//         }
//     },

//     getProblemById: async (id: string) => {
//         try {
//             set({ isProblemLoading: true });
//             const res = await axiosInstance.get(`/problems/get-problem-by-id/${id}`);
//             set({ problem: res.data.problem });
//             toast.success(res.data.message);
//         } catch (error) {
//             console.log("Error getting problem by id", error);
//             toast.error("Error getting problem by id");
//         } finally {
//             set({ isProblemLoading: false });
//         }
//     },

//     getSolvedProblemByUser: async () => {
//         try {
//             set({ isProblemLoading: true });
//             const res = await axiosInstance.get("/problems/get-solved-problems");
//             set({ solvedProblems: res.data.problems });
//             toast.success(res.data.message);
//         } catch (error) {
//             console.log("Error getting solved problems by user", error);
//             toast.error("Error getting solved problems by user");
//         } finally {
//             set({ isProblemLoading: false });
//         }
//     },
// }))




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
            console.log("Problems API response:", res.data);

            // Check all possible locations of the problems array
            const problemsArray = Array.isArray(res.data) ? res.data : 
                Array.isArray(res.data.data) ? res.data.data :
                (res.data?.problems && Array.isArray(res.data.problems)) ? res.data.problems : [];

            console.log("Problems data structure:", {
                isArray: Array.isArray(res.data),
                hasProblems: Boolean(res.data?.problems),
                hasData: Boolean(res.data?.data),
                dataIsArray: Array.isArray(res.data?.data),
                finalArray: problemsArray
            });
            
            set({ 
                problems: problemsArray
            });
            
            if (problemsArray.length > 0) {
                toast.success("Problems fetched successfully");
            }
        } catch (error) {
            console.log("Error getting all problems", error);
            toast.error("Error getting all problems");
            set({ problems: [] });
        } finally {
            set({
                isProblemsLoading: false,
            });
        }
    },

    getProblemById: async (id: string) => {
        try {
            set({ isProblemLoading: true });
            const res = await axiosInstance.get(`/problems/get-problem-by-id/${id}`);
            // Check if problem is in res.data or res.data.problem
            const problem = res.data.problem || res.data;
            set({ problem });
            toast.success(res.data.message || "Problem fetched successfully");
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
            // Check if problems are in res.data or res.data.problems
            const problems = res.data.problems || res.data.data || [];
            set({ solvedProblems: problems });
            toast.success(res.data.message || "Solved problems fetched successfully");
        } catch (error) {
            console.log("Error getting solved problems by user", error);
            toast.error("Error getting solved problems by user");
        } finally {
            set({ isProblemLoading: false });
        }
    },
}))
