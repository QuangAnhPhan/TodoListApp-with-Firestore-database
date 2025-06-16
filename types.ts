import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date | FirebaseFirestoreTypes.Timestamp;
  updatedAt?: Date | FirebaseFirestoreTypes.Timestamp;
}

export type FilterType = 'ALL' | 'COMPLETED' | 'NOT COMPLETED';