import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProblemStore } from "../store/useProblemStore";
import { axiosInstance } from "../utils/axios";

const difficulties = ["Easy", "Medium", "Hard"];

const CreateContestPage: React.FC = () => {
  const navigate = useNavigate();
  const { problems, getAllProblems, isProblemsLoading } = useProblemStore();
  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: "",
    duration: 120,
    difficulty: "Medium",
  });
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllProblems();
  }, [getAllProblems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

//   const handleProblemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
//         const options = Array.from(e.target.selectedOptions);
//         setSelectedProblems(options.map((opt) => opt.value));
//     };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    const startTimeDate = new Date(form.startTime);
    const endTime = new Date(startTimeDate.getTime() + form.duration * 60000).toISOString();
    
    const contestData = { 
      ...form, 
      problems: selectedProblems,
      endTime // Add computed endTime
    };
    
    console.log("Submitting contest data:", contestData); // Debug log
    
    // Make sure you're using the correct endpoint
    const response = await axiosInstance.post("/contest/create-contest", contestData);
    console.log("Response:", response.data); // Debug log
    
    navigate("/contest");
  } catch (err: any) {
    console.error("Error details:", err.response?.data || err); // Detailed error logging
    setError(err.response?.data?.message || err.message || "Error creating contest");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111714] to-[#1c2620] flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-xl bg-[#181f1b]/80 rounded-2xl shadow-xl border border-[#29382f] p-8 flex flex-col gap-8 backdrop-blur-md">
        <h1 className="text-3xl font-bold text-white mb-6">Create New Contest</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label htmlFor="title" className="block text-white font-semibold mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="input input-bordered w-full bg-[#232b25] text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-white font-semibold mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="textarea textarea-bordered w-full bg-[#232b25] text-white"
              rows={4}
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="startTime" className="block text-white font-semibold mb-2">Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="input input-bordered w-full bg-[#232b25] text-white"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="duration" className="block text-white font-semibold mb-2">Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                className="input input-bordered w-full bg-[#232b25] text-white"
                min={10}
                max={600}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="difficulty" className="block text-white font-semibold mb-2">Difficulty</label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="select select-bordered w-full bg-[#232b25] text-white"
              required
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">
                Select Problems for Contest ({selectedProblems.length} selected)
            </label>
            <div className="bg-[#232b25] border border-[#29382f] rounded-lg p-4 max-h-80 overflow-y-auto">
                {isProblemsLoading ? (
                <div className="text-gray-400 text-center py-4">Loading problems...</div>
                ) : problems.length === 0 ? (
                <div className="text-gray-400 text-center py-4">No problems available</div>
                ) : (
                problems.map((problem) => (
                    <div key={problem.id} className="form-control mb-2">
                    <label className="cursor-pointer flex items-center p-2 hover:bg-[#29382f] rounded">
                        <input
                        type="checkbox"
                        className="checkbox checkbox-primary mr-3"
                        checked={selectedProblems.includes(problem.id)}
                        onChange={() => {
                            if (selectedProblems.includes(problem.id)) {
                            setSelectedProblems(selectedProblems.filter(id => id !== problem.id));
                            } else {
                            setSelectedProblems([...selectedProblems, problem.id]);
                            }
                        }}
                        />
                        <span className="text-white">{problem.title} ({problem.difficulty})</span>
                    </label>
                    </div>
                ))
                )}
            </div>
            {selectedProblems.length === 0 && (
                <p className="text-red-400 text-sm mt-1">Select at least one problem</p>
            )}
            </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Contest"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateContestPage;
