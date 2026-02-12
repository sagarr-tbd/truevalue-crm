import { mockProjectsApi } from './mock/projects';
// import { realProjectsApi } from './real/projects'; // Future: Django API

const USE_MOCK = true; // Change to false when Django backend is ready

export const projectsApi = USE_MOCK ? mockProjectsApi : mockProjectsApi; // Future: realProjectsApi
