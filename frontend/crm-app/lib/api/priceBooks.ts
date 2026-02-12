import { priceBooksApi as mockPriceBooksApi } from "./mock/priceBooks";

const USE_MOCK = true;

export const priceBooksApi = USE_MOCK ? mockPriceBooksApi : mockPriceBooksApi;
