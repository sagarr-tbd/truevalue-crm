import { mockCasesApi } from './mock/cases';
// import { realCasesApi } from './real/cases'; // Future: Django API

const USE_MOCK = true; // Change to false when Django backend is ready

export const casesApi = USE_MOCK ? mockCasesApi : mockCasesApi; // Future: realCasesApi
