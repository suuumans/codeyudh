import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { usePlaylistStore } from '../store/usePlaylistStore';


interface AddToPlaylistProps {
    isOpen: boolean;
    onClose: () => void;
    problemId: string;
}

const AddToPlaylistModal: React.FC<AddToPlaylistProps> = ({ isOpen, onClose, problemId }) => {
  const playlists = usePlaylistStore((state) => state.playlists);
  const getAllPlaylists = usePlaylistStore((state) => state.getAllPlaylists);
  const addProblemToPlaylist = usePlaylistStore((state) => state.addProblemToPlaylist);
  const isLoading = usePlaylistStore((state) => state.isLoading);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');

  useEffect(() => {
    if (isOpen) {
      getAllPlaylists();
    }
  }, [isOpen, getAllPlaylists]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlaylist) return;

    try {
      console.log('Submitting add to playlist:', { selectedPlaylist, problemId });
      await addProblemToPlaylist(selectedPlaylist, [problemId]);
      // Optionally refresh all playlists after adding
      await getAllPlaylists();
      onClose();
    } catch (error) {
      // Don't close modal on error
      console.error('Failed to add problem to playlist:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-base-300">
          <h3 className="text-xl font-bold">Add to Playlist</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="form-control">
            <label className="label" htmlFor="playlist-select">
              <span className="label-text font-medium">Select Playlist</span>
            </label>
            <select
              id="playlist-select"
              className="select select-bordered w-full"
              value={selectedPlaylist}
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Select a playlist</option>
              {Array.isArray(playlists) ? (
                playlists.filter(p => p?.id).map((playlist) => (
                  <option key={playlist?.id} value={playlist?.id}>
                    {playlist?.name}
                  </option>
                ))
              ) : (
                <option value="">No playlists available</option>
              )}

            </select>

          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!selectedPlaylist || isLoading}
            >
              Add to Playlist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;