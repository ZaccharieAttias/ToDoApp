export interface Task {
  id: string;
  uid: string;
  title: string;
  description: string;
  dueDate: Date;
  status: boolean;
  tags?: string[];
  sharedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
}
