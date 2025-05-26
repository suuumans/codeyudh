

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
}
