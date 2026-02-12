import { salesOrdersApi as mockSalesOrdersApi } from "./mock/salesOrders";

const USE_MOCK = true;

export const salesOrdersApi = USE_MOCK ? mockSalesOrdersApi : mockSalesOrdersApi;
