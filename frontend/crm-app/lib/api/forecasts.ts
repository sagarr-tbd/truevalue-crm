import { forecastsApi as mockForecastsApi } from "./mock/forecasts";

const USE_MOCK = true;

export const forecastsApi = USE_MOCK ? mockForecastsApi : mockForecastsApi;
