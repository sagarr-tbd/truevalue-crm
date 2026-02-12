import { documentsApi as mockDocumentsApi } from "./mock/documents";

const USE_MOCK = true;

export const documentsApi = USE_MOCK ? mockDocumentsApi : mockDocumentsApi;
