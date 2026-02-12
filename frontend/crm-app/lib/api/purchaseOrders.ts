import { purchaseOrdersApi as mockPurchaseOrdersApi } from "./mock/purchaseOrders";

const USE_MOCK = true;

export const purchaseOrdersApi = USE_MOCK ? mockPurchaseOrdersApi : mockPurchaseOrdersApi;
