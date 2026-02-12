import { productsApi as mockProductsApi } from './mock/products';
// import { productsApi as realProductsApi } from './real/products'; // Future: Django API

// Toggle between mock and real API
const USE_MOCK = true; // Change to false when Django backend is ready

export const productsApi = USE_MOCK ? mockProductsApi : mockProductsApi; // Future: realProductsApi
