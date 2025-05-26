
import { create } from "zustand";
import { axiosInstance } from "../utils/axios";
import toast from "react-hot-toast";

interface ActionState {
  isDeletingProblem: boolean;
  onDeleteProblem: (id: string) => Promise<void>;
}

export const useActionStore = create<ActionState>((set, _get) => ({
  isDeletingProblem: false,
  onDeleteProblem: async (id: string) => {
    try {
      set({ isDeletingProblem: true });
      const res = await axiosInstance.delete(`/problems/delete-problem/${id}`);
      toast.success(res.data.message ?? "Problem deleted successfully");
    } catch (error) {
      console.log("Error deleting problem", error);
      toast.error("Error deleting problem");
    } finally {
      set({ isDeletingProblem: false });
    }
  }
}));
