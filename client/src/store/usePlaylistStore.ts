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
  description?: string;
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
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post(
        "/playlist/create-playlist",
        playlistData
      );

      set((state) => ({
        playlists: Array.isArray(state.playlists) 
        ? [...state.playlists, response.data.playList]
        : [response.data.playList]
      }));

      toast.success("Playlist created successfully");
      return response.data.playList;
    } catch (error: any) {
      console.error("Error creating playlist:", error);
      if (error.response?.data?.error?.includes("unique constraint") || 
          error.response?.status === 500) {
        toast.error("A playlist with this name already exists");
      } else {
        toast.error(error.response?.data?.error ?? "Failed to create playlist");
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // getAllPlaylists: async () => {
  //     try {
  //     const response = await axiosInstance.get('/playlist');
  //     console.log("Playlist API response:", response.data);
      
  //     // Make sure we're setting the actual data array from the response
  //     if (response.data?.success && Array.isArray(response.data?.data)) {
  //       set({ playlists: response.data.data });
  //       console.log("Setting playlists to:", response.data.data);
  //     } else {
  //       console.error("Invalid playlist data format:", response.data);
  //       set({ playlists: [] });
  //     }
  //   } catch (error) {
  //     console.error("Error fetching playlists:", error);
  //     set({ playlists: [] });
  //   }
  // },

  // In usePlaylistStore.ts
  getAllPlaylists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/playlist');
      console.log("Playlist API response:", response.data);
      
      if (response.data?.success && Array.isArray(response.data?.data)) {
        set({ playlists: response.data.data, isLoading: false });
        return response.data.data; // Return the data for direct use
      } else {
        console.error("Invalid playlist data format:", response.data);
        set({ playlists: [], isLoading: false, error: "Invalid data format" });
        return [];
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
      set({ playlists: [], isLoading: false, error: "Failed to fetch playlists" });
      return [];
    }
  },


  getPlaylistDetails: async (playlistId: string) => {
    try {
      set({ isLoading: true });
      const response = await axiosInstance.get(`/playlist/${playlistId}`);
      // Merge playlist and problems into currentPlaylist
      const { playlist, problems } = response.data ?? {};
      console.log("Playlist API response:", response.data);
      set({ currentPlaylist: playlist ? { ...playlist, problems: problems ?? [] } : null });
    } catch (error) {
      console.error("Error fetching playlist details:", error);
      toast.error("Failed to fetch playlist details");
    } finally {
      set({ isLoading: false });
    }
  },

  // addProblemToPlaylist: async (playlistId: string, problemIds: string[]) => {
  //   try {
  //     set({ isLoading: true });
  //     // Only support single problem add for now
  //     const problemId = problemIds[0];
  //     console.log('Calling backend to add problem to playlist:', { playlistId, problemId });
  //     const response = await axiosInstance.post(`/playlist/${playlistId}/add-problem`, {
  //       problemId,
  //     });
  //     console.log('Backend response for addProblemToPlaylist:', response);

  //     toast.success("Problem added to playlist");

  //     // Refresh the playlist details
  //     if (get().currentPlaylist?.id === playlistId) {
  //       await get().getPlaylistDetails(playlistId);
  //     }
  //   } catch (error) {
  //     console.error("Error adding problem to playlist (store):", error);
  //     toast.error("Failed to add problem to playlist");
  //     throw error;
  //   } finally {
  //     set({ isLoading: false });
  //   }
  // },

  addProblemToPlaylist: async (playlistId: string, problemIds: string[]) => {
    try {
      set({ isLoading: true });
      // Only support single problem add for now
      const problemId = problemIds[0];
      console.log('Calling backend to add problem to playlist:', { playlistId, problemId });
      const response = await axiosInstance.post(`/playlist/${playlistId}/add-problem`, {
        problemId,
      });
      console.log('Backend response for addProblemToPlaylist:', response);

      toast.success("Problem added to playlist");

      // Refresh the playlist details
      if (get().currentPlaylist?.id === playlistId) {
        await get().getPlaylistDetails(playlistId);
      }
    } catch (error) {
      console.error("Error adding problem to playlist (store):", error);
      toast.error("Failed to add problem to playlist");
      throw error; // Re-throw to handle in the component
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
