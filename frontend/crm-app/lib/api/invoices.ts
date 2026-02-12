import { invoicesApi as mockInvoicesApi } from "./mock/invoices";

const USE_MOCK = true;

export const invoicesApi = USE_MOCK ? mockInvoicesApi : mockInvoicesApi;
