import { mockServicesApi } from './mock/services';
// import { realServicesApi } from './real/services'; // Future: Django API

const USE_MOCK = true; // Change to false when Django backend is ready

export const servicesApi = USE_MOCK ? mockServicesApi : mockServicesApi; // Future: realServicesApi
