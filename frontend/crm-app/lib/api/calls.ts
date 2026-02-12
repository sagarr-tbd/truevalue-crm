import { mockCallsApi } from './mock/calls';
// import { realCallsApi } from './real/calls'; // Future: Django API

const USE_MOCK = true; // Change to false when Django backend is ready

export const callsApi = USE_MOCK ? mockCallsApi : mockCallsApi; // Future: realCallsApi
