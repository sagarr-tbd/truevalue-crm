import { mockMeetingsApi } from './mock/meetings';
// import { realMeetingsApi } from './real/meetings'; // Future: Django API

const USE_MOCK = true; // Change to false when Django backend is ready

export const meetingsApi = USE_MOCK ? mockMeetingsApi : mockMeetingsApi; // Future: realMeetingsApi
