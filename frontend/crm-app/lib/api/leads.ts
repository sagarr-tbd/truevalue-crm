import { mockLeadsApi } from './mock/leads';
// import { realLeadsApi } from './real/leads'; // Future: Django API

// Toggle between mock and real API
const USE_MOCK = true; // Change to false when Django backend is ready

export const leadsApi = USE_MOCK ? mockLeadsApi : mockLeadsApi; // Future: realLeadsApi
