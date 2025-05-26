import { create } from "zustand";
import { axiosInstance } from "../utils/axios.ts";
import toast from "react-hot-toast";
import type { Submission } from "../types/submissionStoreType.ts";

export const useSubmissionStore = create<{
  isLoading: boolean;
  submissions: Submission[];
  submission: Submission | null;
  submissionCount: number | null;
  getAllSubmissions: () => Promise<void>;
  getSubmissionForProblem: (problemId: string) => Promise<void>;
  getSubmissionCountForProblem: (problemId: string) => Promise<void>;
}>((set, _get) => ({     // (set, get)
  isLoading: false,
  submissions: [],
  submission: null,
  submissionCount: null,

  getAllSubmissions: async () => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.get("/submissions/get-all-submissions");

      set({ submissions: res.data.submissions });

      toast.success(res.data.message);
    } catch (error) {
      console.log("Error getting all submissions", error);
      toast.error("Error getting all submissions");
    } finally {
      set({ isLoading: false });
    }
  },

  getSubmissionForProblem: async (problemId: string) => {
    try {
      const res = await axiosInstance.get(
        `/submissions/get-submissions/${problemId}`
      );
      // Ensure testCases in submission have all required properties
      const rawSubmission = res.data.submissions;
      rawSubmission?.testCases?.forEach((tc: any, idx: number) => {
        rawSubmission.testCases[idx] = {
          id: tc.id ?? idx,
          passed: tc.passed ?? false,
          input: tc.input ?? '',
          output: tc.output ?? '',
          expected: tc.expected ?? '',
          stdout: tc.stdout ?? '',
          memory: tc.memory ?? '',
          time: tc.time ?? '',
        };
      });
      set({ submission: rawSubmission });
    } catch (error) {
      console.log("Error getting submissions for problem", error);
      toast.error("Error getting submissions for problem");
    } finally {
      set({ isLoading: false });
    }
  },

  getSubmissionCountForProblem: async (problemId: string) => {
    try {
      const res = await axiosInstance.get(
        `/submissions/get-submissions-count/${problemId}`
      );                

      set({ submissionCount: res.data.count });
    } catch (error) {
      console.log("Error getting submission count for problem", error);
      toast.error("Error getting submission count for problem");
    }
  },
}));