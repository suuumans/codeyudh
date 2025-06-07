
import React from 'react'
import { CheckCircle2, XCircle, Clock, MemoryStick as Memory } from 'lucide-react'


interface TestCase {
  id: number;
  passed: boolean;
  input: string;
  output: string;
  expected: string;
  stdout?: string;
  memory: string;
  time: string;
}

interface SubmissionProps {
  submission: {
    status: string;
    memory: string;
    time: string;
    testCases: TestCase[];
  };
}

const SubmissionResults: React.FC<SubmissionProps> = ({ submission }) => {

  // Check if submission or testCases exists
  if (!submission || !submission.testCases || submission.testCases.length === 0) {
    return <div className="text-base-content/70">No submission data available</div>;
  }
  const memoryArr = (() => {
    try {
      return JSON.parse(submission.memory || '[]');
    } catch (e) {
      console.error('Error parsing memory data:', e);
      return [];
    }
  })();

  const timeArr = (() => {
    try {
      return JSON.parse(submission.time || '[]');
    } catch (e) {
      console.error('Error parsing time data:', e);
      return [];
    }
  })();

  // Calculate averages with safety checks for empty arrays
  // For memory calculations
const avgMemory = memoryArr
  .map((memoryValue: string) => parseFloat(memoryValue))
  .reduce((accumulator: number, currentValue: number) => accumulator + currentValue, 0) / memoryArr.length;

// For time calculations
const avgTime = timeArr
  .map((timeValue: string) => parseFloat(timeValue))
  .reduce((accumulator: number, currentValue: number) => accumulator + currentValue, 0) / timeArr.length;


  const passedTests = submission.testCases.filter(testCase => testCase.passed).length;
  const totalTests = submission.testCases.length;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="card-title text-sm">Status</h3>
            <div className={`text-lg font-bold ${
              submission.status === 'Accepted' ? 'text-success' : 'text-error'
            }`}>
              {submission.status}
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="card-title text-sm">Success Rate</h3>
            <div className="text-lg font-bold">
              {successRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="card-title text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg. Runtime
            </h3>
            <div className="text-lg font-bold">
              {avgTime.toFixed(3)} s
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="card-title text-sm flex items-center gap-2">
              <Memory className="w-4 h-4" />
              Avg. Memory
            </h3>
            <div className="text-lg font-bold">
              {avgMemory.toFixed(0)} KB
            </div>
          </div>
        </div>
      </div>

      {/* Test Cases Results */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Test Cases Results</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Expected Output</th>
                  <th>Your Output</th>
                  <th>Memory</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {submission.testCases.map((testCase) => (
                  <tr key={testCase.id}>
                    <td>
                      {testCase.passed ? (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle2 className="w-5 h-5" />
                          Passed
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-error">
                          <XCircle className="w-5 h-5" />
                          Failed
                        </div>
                      )}
                    </td>
                    <td className="font-mono">{testCase.expected}</td>
                    <td className="font-mono">{testCase.stdout ?? 'null'}</td>
                    <td>{testCase.memory}</td>
                    <td>{testCase.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionResults;
