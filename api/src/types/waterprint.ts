import { Timestamp } from 'firebase-admin/firestore';

export interface Answer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

export interface Task {
  taskId: string;
  waterprintReduction: number;
  completionDate: Timestamp;
}

export interface ProgressPoint {
  date: Timestamp;
  waterprint: number;
}

export interface InitialAssessment {
  answers: Answer[];
  correctAnswersCount: number;
  date: Timestamp;
}

export interface WaterprintProfile {
  id?: string;
  userId: string;
  initialWaterprint: number;
  currentWaterprint: number;
  initialAssessment: InitialAssessment;
  completedTasks: Task[];
  progressHistory: ProgressPoint[];
} 