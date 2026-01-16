import React, { useMemo, useState } from 'react'
import type { Problem } from '../store/useProblemStore'
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { Bookmark, PencilIcon, TrashIcon, Plus  } from 'lucide-react';
import type { AuthStore } from '../types/authStoreType';
import { usePlaylistStore } from '../store/usePlaylistStore';
import AddToPlaylistModal from './AddToPlaylist';
import CreatePlaylistModal, { type PlaylistFormData } from './CreatePlaylistModel';

interface ProblemTableProps {
  problems: Problem[];
  onDeleteProblem?: (id: string) => void
}
const ProblemTable: React.FC<ProblemTableProps> = ({ problems, onDeleteProblem }) => {
    const { authUser } = useAuthStore() as AuthStore
    const { createPlaylist } = usePlaylistStore()
    const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
    const [search, setSearch]  = useState('')
    const [difficulty, setDifficulty] = useState('ALL')
    const [selectedTag, setSelectedTag] = useState('ALL')
    const [currentPage, setCurrentPage] = useState(1)

    // extract all tags from problems
    const allTags = useMemo((): string[] => {
      if (!Array.isArray(problems)) return [];
      
      const tagsSet = new Set<string>();
      
      problems.forEach((problem) => problem.tags?.forEach((tag) => tagsSet.add(tag)));
      
      return Array.from(tagsSet);
    }, [problems]);


    const filteredProblems = useMemo(() => {
      return (problems || [])
      .filter((problem) => problem.title.toLowerCase().includes(search.toLowerCase()))
      .filter((problem) => difficulty === 'ALL' || problem.difficulty === difficulty)
      .filter((problem) => selectedTag === 'ALL' || problem.tags?.includes(selectedTag))
    }, [search, difficulty, selectedTag, problems])

    const itemsPerPage = 15
    const totalPages = Math.ceil(filteredProblems.length / itemsPerPage)
    const paginatedProblems = useMemo(() => {
      return filteredProblems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    }, [filteredProblems, currentPage])

    // all difficulties
    const difficulties: string[] = ["EASY", "MEDIUM", "HARD"]


    const handleDelete = (id: string) => {
      if (onDeleteProblem) {
        onDeleteProblem(id);
      }
    }

    const handleAddToPlaylist = (id: string) => {
      setSelectedProblemId(id);
      setIsAddToPlaylistModalOpen(true);
    }

    const handleCreatePlaylist = async (playlistData: { name: string; description?: string }) => {
      await createPlaylist({
        name: playlistData.name,
        description: playlistData.description ?? '' // Provide default empty string
      });
      setIsCreateModalOpen(false);
    }
    
  return (
    // Create Playlist
    <div className='w-full max-w-6xl mx-auto mt-6 sm:mt-10 px-2 sm:px-0'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6'>
            <h2 className='text-xl sm:text-2xl font-bold'>Problems</h2>
            <button className='btn btn-primary btn-sm sm:btn-md gap-2 w-full sm:w-auto' onClick={() => setIsCreateModalOpen(true)}>
                <Plus className='w-4 h-4' />
                Create Playlist
            </button>
        </div>


        {/* Search bar */}
        <div className='flex flex-col md:flex-row justify-between items-stretch md:items-center mb-4 sm:mb-6 gap-3 sm:gap-4'>
            <input type="text" placeholder="Search by title" className="input input-bordered input-sm sm:input-md w-full md:w-1/3 bg-base-200" value={search} onChange={(e) => setSearch(e.target.value)}/>
            <div className='flex w-full md:w-auto gap-2'>
                <select className='select select-bordered select-sm sm:select-md bg-base-200 flex-1 md:flex-none text-xs sm:text-sm' value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)} >
                    <option value='ALL'>
                        All Difficulties
                    </option>
                    {difficulties.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()}
                        </option>
                    ))}
                </select>

                <select className='select select-bordered select-sm sm:select-md bg-base-200 flex-1 md:flex-none text-xs sm:text-sm' value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
                    <option value='ALL'>
                        All Tags
                    </option>
                    {allTags.map((tag) => (
                        <option key={tag} value={tag}>{tag}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-4">
          {paginatedProblems.length > 0 ? (
            paginatedProblems.map((problem) => {
               const isSolved = problem.solvedBy?.some(
                  (user) => user.id === authUser?.id
                );
              return (
              <div key={problem.id} className="card bg-base-200 shadow-md border border-base-300">
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <Link to={`/problem/${problem.id}`} className="card-title text-base sm:text-lg hover:underline">
                      {problem.title}
                    </Link>
                     <span
                        className={`badge font-semibold text-xs text-white shrink-0 ${
                          problem.difficulty === "EASY"
                            ? "badge-success"
                            : problem.difficulty === "MEDIUM"
                            ? "badge-warning"
                            : "badge-error"
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 my-2">
                     {(problem.tags || []).map((tag, idx) => (
                          <span
                            key={idx}
                            className="badge badge-outline badge-warning text-xs font-bold"
                          >
                            {tag}
                          </span>
                      ))}
                  </div>

                  <div className="card-actions justify-end items-center mt-2 border-t border-base-content/10 pt-3">
                     <div className='flex items-center gap-2 mr-auto'>
                         <span className="text-sm text-gray-500">Solved: </span>
                         <input
                            type="checkbox"
                            checked={isSolved}
                            readOnly
                            className="checkbox checkbox-xs"
                          />
                     </div>
                     <div className="flex gap-2">
                         {authUser?.role === "ADMIN" && (
                              <button
                                onClick={() => handleDelete(problem.id)}
                                className="btn btn-sm btn-square btn-error"
                              >
                                <TrashIcon className="w-4 h-4 text-white" />
                              </button>
                          )}
                        <button
                          className="btn btn-sm btn-outline flex gap-2 items-center"
                          onClick={() => handleAddToPlaylist(problem.id)}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            )})
          ) : (
             <div className="text-center py-6 text-gray-500 bg-base-200 rounded-xl">
                  No problems found.
             </div>
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl shadow-md">
        <table className="table table-zebra table-lg bg-base-200 text-base-content">
          <thead className="bg-base-300">
            <tr>
              <th>Solved</th>
              <th>Title</th>
              <th>Tags</th>
              <th>Difficulty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProblems.length > 0 ? (
              paginatedProblems.map((problem) => {
                const isSolved = problem.solvedBy?.some(
                  (user) => user.id === authUser?.id
                );
                return (
                  <tr key={problem.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSolved}
                        readOnly
                        className="checkbox checkbox-sm"
                      />
                    </td>
                    <td>
                      <Link to={`/problem/${problem.id}`} className="font-semibold hover:underline">
                        {problem.title}
                      </Link>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(problem.tags || []).map((tag, idx) => (
                          <span
                            key={idx}
                            className="badge badge-outline badge-warning text-xs font-bold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge font-semibold text-xs text-white ${
                          problem.difficulty === "EASY"
                            ? "badge-success"
                            : problem.difficulty === "MEDIUM"
                            ? "badge-warning"
                            : "badge-error"
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                        {authUser?.role === "ADMIN" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(problem.id)}
                              className="btn btn-sm btn-error"
                            >
                              <TrashIcon className="w-4 h-4 text-white" />
                            </button>
                            <button disabled className="btn btn-sm btn-warning">
                              <PencilIcon className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        )}
                        <button
                          className="btn btn-sm btn-outline flex gap-2 items-center"
                          onClick={() => handleAddToPlaylist(problem.id)}
                        >
                          <Bookmark className="w-4 h-4" />
                          <span className="hidden sm:inline">Save to Playlist</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No problems found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 sm:mt-6 gap-1 sm:gap-2">
        <button
          className="btn btn-xs sm:btn-sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Prev
        </button>
        <span className="btn btn-ghost btn-xs sm:btn-sm">
          {currentPage} / {totalPages}
        </span>
        <button
          className="btn btn-xs sm:btn-sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>

      {/* Modals */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePlaylist}
      />
      
      {selectedProblemId && (
        <AddToPlaylistModal
          isOpen={isAddToPlaylistModalOpen}
          onClose={() => setIsAddToPlaylistModalOpen(false)}
          problemId={selectedProblemId}
        />
      )}

    </div>
  )
}

export default ProblemTable