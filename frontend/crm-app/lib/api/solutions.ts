import { mockSolutionsApi } from './mock/solutions';
// import { realSolutionsApi } from './real/solutions'; // Future: Django API

const USE_MOCK = true; // Change to false when Django backend is ready

export const solutionsApi = USE_MOCK ? mockSolutionsApi : mockSolutionsApi; // Future: realSolutionsApi
