import { dealsApi as mockDealsApi } from './mock/deals';
// import { dealsApi as realDealsApi } from './real/deals'; // Future: Django API

// Toggle between mock and real API
const USE_MOCK = true; // Change to false when Django backend is ready

export const dealsApi = USE_MOCK ? mockDealsApi : mockDealsApi; // Future: realDealsApi
