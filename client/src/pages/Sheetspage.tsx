import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, List, Clock, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { usePlaylistStore } from "../store/usePlaylistStore";

const SheetsPage: React.FC = () => {
  const { getAllPlaylists, playlists } = usePlaylistStore();
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSheets = async () => {
      setIsLoading(true);
      await getAllPlaylists();
      setIsLoading(false);
    };
    fetchSheets();
  }, [getAllPlaylists]);

  const toggleSheet = (id: string) => {
    setExpandedSheet(expandedSheet === id ? null : id);
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return <span className="badge badge-success">Easy</span>;
      case "MEDIUM":
        return <span className="badge badge-warning">Medium</span>;
      case "HARD":
        return <span className="badge badge-error">Hard</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center px-4">
      <div className="w-full max-w-6xl mx-auto py-10">
        <header className="mb-10">
          <h1 className="text-4xl font-bold mb-2 text-base-content">Sheets (Curated Playlists)</h1>
          <p className="text-lg text-base-content/70 max-w-3xl">Explore handpicked coding sheets to master key topics and ace interviews.</p>
        </header>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : playlists.length === 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <h3 className="text-xl font-medium">No sheets found</h3>
              <p className="text-base-content/70">Sheets will appear here once created by admins or users.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {playlists.map((sheet: any) => (
              <div key={sheet.id} className="card bg-base-100 shadow-md border border-base-300 rounded-xl">
                <div className="card-body p-6">
                  <button
                    type="button"
                    className="flex justify-between items-center w-full text-left"
                    onClick={() => toggleSheet(sheet.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder flex items-center justify-center">
                        <div className="bg-primary text-primary-content rounded-lg w-12 h-12 flex items-center justify-center">
                          <BookOpen size={24} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-base-content">{sheet.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-base-content/70">
                          <div className="flex items-center gap-1">
                            <List size={14} />
                            <span>{sheet.problems?.length ?? 0} problems</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>Created {formatDate(sheet.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>{expandedSheet === sheet.id ? <ChevronUp /> : <ChevronDown />}</div>
                  </button>
                  <p className="text-base-content/80 mt-1">{sheet.description}</p>
                  {expandedSheet === sheet.id && (
                    <div className="mt-4 pt-4 border-t border-base-300">
                      <h4 className="text-lg font-semibold mb-3 text-base-content">Problems in this sheet</h4>
                      {(!sheet.problems || sheet.problems.length === 0) ? (
                        <div className="alert bg-base-200 text-base-content border-none">
                          <span>No problems added to this sheet yet.</span>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl shadow-md">
                          <table className="table table-zebra table-lg bg-base-200 text-base-content">
                            <thead className="bg-base-300">
                              <tr>
                                <th className="font-semibold">Title</th>
                                <th className="font-semibold">Difficulty</th>
                                <th className="font-semibold">Tags</th>
                                <th className="text-right font-semibold">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(sheet.problems ?? []).map((item: any) => (
                                <tr key={item.id}>
                                  <td className="font-semibold">
                                    {item.problem?.title ?? item.title}
                                  </td>
                                  <td>
                                    {getDifficultyBadge(item.problem?.difficulty ?? item.difficulty)}
                                  </td>
                                  <td>
                                    <div className="flex flex-wrap gap-1">
                                      {(item.problem?.tags ?? item.tags ?? []).map((tag: string) => (
                                        <span key={tag} className="badge badge-outline badge-warning text-xs font-bold">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="text-right">
                                    <Link
                                      to={`/problem/${item.problem?.id ?? item.id}`}
                                      className="btn btn-xs btn-outline btn-primary"
                                    >
                                      <ExternalLink size={12} />
                                      Solve
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetsPage;
