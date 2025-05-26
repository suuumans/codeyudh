
import { create } from "zustand";
import { axiosInstance } from "../utils/axios";
import toast from "react-hot-toast";

interface Submission {
  id?: string;
  userId?: string;
  problemId?: string;
  sourceCode?: string;
  language?: string;
  stdin?: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  status?: string;
  time?: string;
  memory?: string;
}

interface ExecutionState {
  isExecuting: boolean;
  submission: Submission | null;
  executeCode: (
    source_code: string,
    language_id: number | string,
    stdin: string | string[],
    expected_outputs: string | string[],
    problemId: string
  ) => Promise<void>;
}

export const useExecutionStore = create<ExecutionState>((set, _) => ({
  isExecuting: false,
  submission: null,
  executeCode: async (source_code, language_id, stdin, expected_outputs, problemId) => {
    try {
      set({ isExecuting: true });
      console.log("Submission:", JSON.stringify({
        source_code,
        language_id,
        stdin,
        expected_outputs,
        problemId
      }));
      const res = await axiosInstance.post("/execute-code", { 
        source_code, 
        language_id, 
        stdin, 
        expected_outputs, 
        problemId 
      });

      set({ submission: res.data.submission });
      
      toast.success(res.data.message ?? "Code executed successfully");
    } catch (error) {
      console.log("Error executing code", error);
      toast.error("Error executing code");
    } finally {
      set({ isExecuting: false });
    }
  }
}));
