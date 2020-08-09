import TaskClass from './model/task.model';
export const Task = TaskClass;

import TaskSourceClass from './model/task-source.model';
export type TaskSource<TResult, TArgs> = TaskSourceClass<TResult, TArgs>;