import React, { useEffect, useState } from "react";
import { Calendar, Clock, Trophy, Users, ChevronRight, Crown } from "lucide-react";
import { Link } from "react-router-dom";

interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  duration: number;
  participants?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  winners?: string[];
}

interface ContestsState {
  upcoming: Contest[];
  active: Contest[];
  past: Contest[];
}

interface ContestRanking {
  name: string;
  score: number;
  rank: number;
}

const ContestsPage: React.FC = () => {
  const [contests, setContests] = useState<ContestsState>({
    upcoming: [],
    active: [],
    past: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active' | 'past'>('upcoming');
  const [rankings, setRankings] = useState<ContestRanking[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setIsLoading(true);
        // Replace with actual API call
        // const response = await fetch('/api/v1/contests');
        // const data = await response.json();

        const response = await fetch('/api/v1/contest');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allContests: Contest[] = await response.json();

        const now = new Date();
        const categorizedContests: ContestsState = {
          upcoming: [],
          active: [],
          past: [],
        };

        allContests.forEach(contest => {
          const startTimeDate = new Date(contest.startTime);
          // Ensure duration is a number and positive
          const durationMinutes = typeof contest.duration === 'number' && contest.duration > 0 ? contest.duration : 0;
          const endTimeDate = new Date(startTimeDate.getTime() + durationMinutes * 60000); // 60000 ms in a minute

          if (startTimeDate > now) {
            categorizedContests.upcoming.push(contest);
          } else if (endTimeDate > now) { // Contest started but not ended
            categorizedContests.active.push(contest);
          } else { // Contest ended
            categorizedContests.past.push(contest);
          }
        });

        // Sort contests within each category
        categorizedContests.upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        categorizedContests.active.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        // Show most recent past contests first
        categorizedContests.past.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        setContests(categorizedContests);
      } catch (error) {
        console.error('Error fetching contests:', error);
        // Optionally, set an error state here to inform the user
        setContests({ upcoming: [], active: [], past: [] }); // Reset or keep stale data
      } finally {
        setIsLoading(false);
      }
    };

    fetchContests();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      let contestId = null;
      if (contests.active.length > 0) contestId = contests.active[0].id;
      else if (contests.past.length > 0) contestId = contests.past[0].id;
      else if (contests.upcoming.length > 0) contestId = contests.upcoming[0].id;
      if (!contestId) {
        setRankings([]);
        setLeaderboardLoading(false);
        return;
      }
      try {
        // Replace with your actual API endpoint
        const res = await fetch(`/api/contests/${contestId}/leaderboard`);
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const data = await res.json();
        // Expecting data to be an array of { name, score, rank }
        setRankings(Array.isArray(data) ? data.slice(0, 10) : []);
      } catch (err: any) {
        setLeaderboardError(err.message || 'Error fetching leaderboard');
        setRankings([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    fetchLeaderboard();
    // Only re-run when contests change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contests.active, contests.past, contests.upcoming]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (dateString: string): string => {
    const contestDate = new Date(dateString);
    const now = new Date();
    const diff = contestDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h ${minutes}m remaining`;
  };

  const renderContestList = (contestList: Contest[]) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      );
    }

    if (contestList.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-xl text-gray-500">No contests available at the moment.</p>
          {activeTab === 'upcoming' && (
            <p className="mt-2 text-gray-400">Check back soon for new challenges!</p>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-6 mt-6">
        {contestList.map(contest => (
          <div key={contest.id} className="bg-[#1A231E] border border-[#29382f] rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-green-500">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{contest.title}</h3>
                  <p className="text-gray-300 mb-4">{contest.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(contest.startTime)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{contest.duration} minutes</span>
                    </div>
                    {contest.participants !== undefined && contest.participants > 0 && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{contest.participants} participants</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    contest.difficulty === 'Easy' ? 'bg-green-900 text-green-300' :
                    contest.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {contest.difficulty}
                  </span>
                  
                  {activeTab === 'upcoming' && (
                    <span className="text-green-400 mt-4 text-sm font-medium">
                      {getTimeRemaining(contest.startTime)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-between items-center">
                {activeTab === 'past' ? (
                  <div className="flex items-center">
                    <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                    <span className="text-gray-300">
                      {contest.winners ? `${contest.winners.length} winners` : 'Results available'}
                    </span>
                  </div>
                ) : (
                  <div></div>
                )}
                
                <button className="btn bg-green-600 hover:bg-green-700 text-white border-none flex items-center">
                  {activeTab === 'upcoming' ? 'Register' : 
                   activeTab === 'active' ? 'Enter Contest' : 'View Results'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#111714] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">CodeYudh Contests</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Participate in thrilling coding battles, compete with peers, and climb the ranks to coding greatness.
          </p>
        </header>

        <div className="mb-8">
          <div className="border-b border-[#29382f] flex">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-b-2 border-green-500 text-green-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-b-2 border-green-500 text-green-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-b-2 border-green-500 text-green-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {renderContestList(contests[activeTab])}
        
        {activeTab === 'upcoming' && (
          <div className="mt-16 bg-gradient-to-r from-[#1A231E] to-[#152118] rounded-lg p-8 border border-[#29382f]">
            <h2 className="text-2xl font-bold mb-4">Host Your Own Contest</h2>
            <p className="text-gray-300 mb-6">
              Are you an educator, company, or coding enthusiast? Create your own coding contest on CodeYudh to engage with our community of developers.
            </p>
            <button className="btn bg-green-600 hover:bg-green-700 text-white border-none">
              Learn More
            </button>
          </div>
        )}

        <div className="mt-16">
          <div className="bg-[#181f1b]/80 rounded-2xl shadow-xl border border-[#29382f] p-8 flex flex-col gap-8 backdrop-blur-md">
            <div className="flex items-center gap-4 mb-6">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">Weekly Coding Contest</h1>
            </div>
            <div className="mb-8">
              <p className="text-lg text-white/80 mb-2">Join our weekly contest and compete with the best!</p>
              <Link to="/home" className="btn btn-primary btn-lg mt-2">Go to Problems</Link>
            </div>
            <div className="overflow-x-auto">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                Top 10 Leaderboard
              </h2>
              {leaderboardLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-400"></div>
                </div>
              ) : leaderboardError ? (
                <div className="text-red-400 py-4">{leaderboardError}</div>
              ) : (
                <table className="table w-full text-white rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-[#232b25]">
                      <th className="py-3 px-4 text-left">Rank</th>
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-4 text-left">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.length === 0 ? (
                      <tr><td colSpan={3} className="text-center text-gray-400 py-6">No leaderboard data yet.</td></tr>
                    ) : (
                      rankings.map((user) => (
                        <tr key={user.rank} className="border-b border-[#29382f] hover:bg-[#232b25]/60 transition">
                          <td className="py-2 px-4 font-bold text-yellow-400">{user.rank}</td>
                          <td className="py-2 px-4">{user.name}</td>
                          <td className="py-2 px-4">{user.score}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestsPage;
