import { mockTasksApi } from './mock/tasks';
// import { realTasksApi } from './real/tasks'; // Future: Django API

const USE_MOCK = true; // Change to false when Django backend is ready

export const tasksApi = USE_MOCK ? mockTasksApi : mockTasksApi; // Future: realTasksApi
