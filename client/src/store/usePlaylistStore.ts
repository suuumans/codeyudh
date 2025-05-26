import { create } from "zustand";
import { axiosInstance } from "../utils/axios";
import toast from "react-hot-toast";

// Define interfaces for the data structures
interface Playlist {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface PlaylistFormData {
  name: string;
  description: string;
}

interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  isLoading: boolean;
  error: string | null;
  
  createPlaylist: (playlistData: PlaylistFormData) => Promise<Playlist | undefined>;
  getAllPlaylists: () => Promise<void>;
  getPlaylistDetails: (playlistId: string) => Promise<void>;
  addProblemToPlaylist: (playlistId: string, problemIds: string[]) => Promise<void>;
  removeProblemFromPlaylist: (playlistId: string, problemIds: string[]) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  currentPlaylist: null,
  isLoading: false,
  error: null,

  createPlaylist: async (playlistData: PlaylistFormData) => {
    try {
      set({ isLoading: true });
      const response = await axiosInstance.post(
        "/playlist/create-playlist",
        playlistData
      );

      set((state) => ({
        playlists: [...state.playlists, response.data.playList],
      }));

      toast.success("Playlist created successfully");
      return response.data.playList;
    } catch (error: any) {
      console.error("Error creating playlist:", error);
      toast.error(error.response?.data?.error ?? "Failed to create playlist");
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getAllPlaylists: async () => {
    try {
      set({ isLoading: true });
      const response = await axiosInstance.get("/playlist");
      set({ playlists: response.data.playLists });
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast.error("Failed to fetch playlists");
    } finally {
      set({ isLoading: false });
    }
  },

  getPlaylistDetails: async (playlistId: string) => {
    try {
      set({ isLoading: true });
      const response = await axiosInstance.get(`/playlist/${playlistId}`);
      set({ currentPlaylist: response.data.playList });
    } catch (error) {
      console.error("Error fetching playlist details:", error);
      toast.error("Failed to fetch playlist details");
    } finally {
      set({ isLoading: false });
    }
  },

  addProblemToPlaylist: async (playlistId: string, problemIds: string[]) => {
    try {
      set({ isLoading: true });
      await axiosInstance.post(`/playlist/${playlistId}/add-problem`, {
        problemIds,
      });

      toast.success("Problem added to playlist");

      // Refresh the playlist details
      if (get().currentPlaylist?.id === playlistId) {
        await get().getPlaylistDetails(playlistId);
      }
    } catch (error) {
      console.error("Error adding problem to playlist:", error);
      toast.error("Failed to add problem to playlist");
    } finally {
      set({ isLoading: false });
    }
  },

  removeProblemFromPlaylist: async (playlistId: string, problemIds: string[]) => {
    try {
      set({ isLoading: true });
      await axiosInstance.post(`/playlist/${playlistId}/remove-problems`, {
        problemIds,
      });

      toast.success("Problem removed from playlist");

      // Refresh the playlist details
      if (get().currentPlaylist?.id === playlistId) {
        await get().getPlaylistDetails(playlistId);
      }
    } catch (error) {
      console.error("Error removing problem from playlist:", error);
      toast.error("Failed to remove problem from playlist");
    } finally {
      set({ isLoading: false });
    }
  },

  deletePlaylist: async (playlistId: string) => {
    try {
      set({ isLoading: true });
      await axiosInstance.delete(`/playlist/${playlistId}`);

      set((state) => ({
        playlists: state.playlists.filter((p) => p.id !== playlistId),
      }));

      toast.success("Playlist deleted successfully");
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast.error("Failed to delete playlist");
    } finally {
      set({ isLoading: false });
    }
  },
}));
