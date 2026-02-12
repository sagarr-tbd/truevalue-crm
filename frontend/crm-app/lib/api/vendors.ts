import { vendorsApi as mockVendorsApi } from './mock/vendors';
// import { vendorsApi as realVendorsApi } from './real/vendors'; // Future: Django API

// Toggle between mock and real API
const USE_MOCK = true; // Change to false when Django backend is ready

export const vendorsApi = USE_MOCK ? mockVendorsApi : mockVendorsApi; // Future: realVendorsApi
