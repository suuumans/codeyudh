export type SubmissionStoreType = {
    isLoading : boolean;
    submissions: [];
    submission: Submission | null;
    submissionCount: number | null;
    getAllSubmissions: () => void;
    getSubmissionForProblem: (problemId: string) => Promise<void>;
    getSubmissionCountForProblem: (problemId: string) => Promise<void>;
}

// src/types/submission.ts
export interface TestCase {
  id: string | number;
  passed: boolean;
  input: string;
  output: string;
  expected: string;
  stdout?: string;
  memory: string;
  time: string;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;  // Choose one naming convention
  sourceCode: string; // Choose one naming convention
  language: string;
  status: string;
  time: string;
  memory: string;
  stdin?: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  testCases: TestCase[];
  createdAt?: Date;
  updatedAt?: Date;
}
