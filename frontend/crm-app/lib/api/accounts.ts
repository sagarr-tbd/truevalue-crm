import { accountsApi as mockAccountsApi } from './mock/accounts';
// import { accountsApi as realAccountsApi } from './real/accounts'; // Future: Django API

// Toggle between mock and real API
const USE_MOCK = true; // Change to false when Django backend is ready

export const accountsApi = USE_MOCK ? mockAccountsApi : mockAccountsApi; // Future: realAccountsApi
