import { campaignsApi as mockCampaignsApi } from './mock/campaigns';
// import { campaignsApi as realCampaignsApi } from './real/campaigns'; // Future: Django API

// Toggle between mock and real API
const USE_MOCK = true; // Change to false when Django backend is ready

export const campaignsApi = USE_MOCK ? mockCampaignsApi : mockCampaignsApi; // Future: realCampaignsApi
