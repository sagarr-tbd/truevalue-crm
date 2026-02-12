import { quotesApi as mockQuotesApi } from "./mock/quotes";

const USE_MOCK = true;

export const quotesApi = USE_MOCK ? mockQuotesApi : mockQuotesApi;
