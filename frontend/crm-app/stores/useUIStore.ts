import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  // View mode (list/grid/kanban)
  viewMode: 'list' | 'grid' | 'kanban';
  setViewMode: (mode: 'list' | 'grid' | 'kanban') => void;
  
  // Stats visibility
  showStats: boolean;
  toggleStats: () => void;
  
  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Pagination preferences
  defaultItemsPerPage: number;
  setDefaultItemsPerPage: (count: number) => void;
  
  // Table density
  tableCompact: boolean;
  setTableCompact: (compact: boolean) => void;
  
  // Filters (persisted per module)
  filters: {
    leads?: {
      status?: string | null;
      rating?: string | null;
      source?: string | null;
      search?: string;
    };
    contacts?: {
      status?: string | null;
      search?: string;
    };
    accounts?: {
      status?: string | null;
      search?: string;
    };
    deals?: {
      stage?: string | null;
      search?: string;
    };
    campaigns?: {
      status?: string | null;
      search?: string;
    };
    products?: {
      status?: string | null;
      search?: string;
    };
    vendors?: {
      status?: string | null;
      search?: string;
    };
    salesOrders?: {
      status?: string | null;
      search?: string;
    };
    quotes?: {
      status?: string | null;
      search?: string;
    };
    invoices?: {
      status?: string | null;
      search?: string;
    };
    purchaseOrders?: {
      status?: string | null;
      search?: string;
    };
    priceBooks?: {
      status?: string | null;
      search?: string;
    };
    documents?: {
      status?: string | null;
      search?: string;
    };
    forecasts?: {
      status?: string | null;
      search?: string;
    };
    tasks?: {
      status?: string | null;
      search?: string;
    };
    calls?: {
      status?: string | null;
      search?: string;
    };
    meetings?: {
      status?: string | null;
      search?: string;
    };
    cases?: {
      status?: string | null;
      search?: string;
    };
    solutions?: {
      status?: string | null;
      search?: string;
    };
    services?: {
      status?: string | null;
      search?: string;
    };
    projects?: {
      status?: string | null;
      search?: string;
    };
    // Add more modules as needed
  };
  setModuleFilters: (module: string, filters: Record<string, string | null | undefined>) => void;
  clearModuleFilters: (module: string) => void;
  clearAllFilters: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // View mode
      viewMode: 'list',
      setViewMode: (mode) => set({ viewMode: mode }),
      
      // Stats visibility
      showStats: false,
      toggleStats: () => set((state) => ({ showStats: !state.showStats })),
      
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      // Pagination
      defaultItemsPerPage: 10,
      setDefaultItemsPerPage: (count) => set({ defaultItemsPerPage: count }),
      
      // Table density
      tableCompact: false,
      setTableCompact: (compact) => set({ tableCompact: compact }),
      
      // Filters
      filters: {},
      setModuleFilters: (module, filterData) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [module]: filterData,
          },
        })),
      clearModuleFilters: (module) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [module]: undefined,
          },
        })),
      clearAllFilters: () => set({ filters: {} }),
    }),
    { name: 'ui-storage' }
  )
);
