import { create } from "zustand";
import { axiosInstance } from "../utils/axios";

export interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  duration: number;
  participants?: number;
  difficulty: "Easy" | "Medium" | "Hard";
  winners?: string[];
}

export interface ContestRanking {
  name: string;
  score: number;
  rank: number;
}

interface ContestsState {
  upcoming: Contest[];
  active: Contest[];
  past: Contest[];
}

interface ContestStore {
  contests: ContestsState;
  isLoading: boolean;
  error: string | null;
  leaderboard: ContestRanking[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  fetchContests: () => Promise<void>;
  fetchLeaderboard: (contestId: string) => Promise<void>;
  createContest: (contestData: Partial<Contest>) => Promise<void>;
  updateContest: (id: string, contestData: Partial<Contest>) => Promise<void>;
  deleteContest: (id: string) => Promise<void>;
}

export const useContest = create<ContestStore>((set, get) => ({
  contests: { upcoming: [], active: [], past: [] },
  isLoading: false,
  error: null,
  leaderboard: [],
  leaderboardLoading: false,
  leaderboardError: null,

  fetchContests: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/contest");
      if (res.data?.success && res.data?.data) {
        set({ contests: res.data.data });
      } else {
        set({ contests: { upcoming: [], active: [], past: [] }, error: "Invalid data format" });
      }
    } catch (err: any) {
      set({ error: err.message ?? "Failed to fetch contests", contests: { upcoming: [], active: [], past: [] } });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLeaderboard: async (contestId: string) => {
    set({ leaderboardLoading: true, leaderboardError: null });
    try {
      const res = await axiosInstance.get(`/contest/${contestId}/leaderboard`);
      set({ leaderboard: Array.isArray(res.data) ? res.data : [], leaderboardError: null });
    } catch (err: any) {
      set({ leaderboard: [], leaderboardError: err.message ?? "Failed to fetch leaderboard" });
    } finally {
      set({ leaderboardLoading: false });
    }
  },

  createContest: async (contestData) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post("/contest/create-contest", contestData);
      await get().fetchContests();
    } catch (err: any) {
      set({ error: err.message ?? "Failed to create contest" });
    } finally {
      set({ isLoading: false });
    }
  },

  updateContest: async (id, contestData) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(`/update-contest/${id}`, contestData);
      await get().fetchContests();
    } catch (err: any) {
      set({ error: err.message ?? "Failed to update contest" });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteContest: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/delete-contest/${id}`);
      await get().fetchContests();
    } catch (err: any) {
      set({ error: err.message ?? "Failed to delete contest" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
