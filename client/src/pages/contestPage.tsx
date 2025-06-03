
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, Users, ChevronRight } from 'lucide-react';

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

const ContestsPage: React.FC = () => {
  const [contests, setContests] = useState<ContestsState>({
    upcoming: [],
    active: [],
    past: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active' | 'past'>('upcoming');

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setIsLoading(true);
        // Replace with actual API call
        // const response = await fetch('/api/v1/contests');
        // const data = await response.json();

        // Mock data for demonstration
        const mockData: ContestsState = {
          upcoming: [
            {
              id: 'c001',
              title: 'Weekly Coding Battle #12',
              description: 'Solve algorithmic puzzles and compete for the top spot!',
              startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
              duration: 120, // in minutes
              participants: 0,
              difficulty: 'Medium',
            },
            {
              id: 'c002',
              title: 'Data Structures Deep Dive',
              description: 'Test your knowledge of advanced data structures.',
              startTime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
              duration: 180,
              difficulty: 'Hard',
            },
          ],
          active: [
            {
              id: 'c003',
              title: 'JavaScript Challenge',
              description: 'Master JavaScript with these tricky problems!',
              startTime: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
              duration: 240,
              participants: 156,
              difficulty: 'Easy',
            },
          ],
          past: [
            {
              id: 'c004',
              title: 'Algorithm Olympiad',
              description: 'Our monthly flagship contest featuring the hardest problems.',
              startTime: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
              duration: 180,
              participants: 342,
              difficulty: 'Hard',
              winners: ['user123', 'user456', 'user789'],
            },
          ],
        };
        
        setContests(mockData);
      } catch (error) {
        console.error('Error fetching contests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContests();
  }, []);

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
      </div>
    </div>
  );
};

export default ContestsPage;
