// Real backend API for accounts/companies
// The mock API is no longer used - keeping import for reference
// import { accountsApi as mockAccountsApi } from './mock/accounts';

import { accountsApi, AccountDisplay } from './companies';

// Export the real API directly
export { accountsApi };

// Re-export the AccountDisplay type
export type { AccountDisplay };
