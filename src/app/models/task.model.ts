export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: Date;
  status: boolean;
  tags?: string[];
  sharedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
}
