import { Pipe, PipeTransform } from '@angular/core';
import { Task } from '../../models/task.model';

@Pipe({
  name: 'filterByStatus',
  standalone: true,
})
export class FilterByStatusPipe implements PipeTransform {
  transform(tasks: Task[] | null, status: string): Task[] {
    if (!tasks) return [];
    if (status === 'all') return tasks;
    if (status === 'completed') return tasks.filter((task) => task.status);
    if (status === 'pending') return tasks.filter((task) => !task.status);
    return tasks;
  }
}
