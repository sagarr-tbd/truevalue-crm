// Forecast display data (matches what the page expects)
export interface ForecastDisplay {
  id: number;
  period: string;
  startDate: string;
  endDate: string;
  targetRevenue: number;
  committedRevenue: number;
  bestCase: number;
  worstCase: number;
  actualRevenue: number;
  progress: number;
  owner: string;
  dealsCount: number;
  status: string;
  initials: string;
}

// Initial mock data
const initialForecasts: ForecastDisplay[] = [
  {
    id: 1,
    period: "Q1 2026",
    startDate: "Jan 1, 2026",
    endDate: "Mar 31, 2026",
    targetRevenue: 2500000,
    committedRevenue: 1850000,
    bestCase: 2200000,
    worstCase: 1650000,
    actualRevenue: 850000,
    progress: 34,
    owner: "John Smith",
    dealsCount: 45,
    status: "On Track",
    initials: "Q1",
  },
  {
    id: 2,
    period: "Q2 2026",
    startDate: "Apr 1, 2026",
    endDate: "Jun 30, 2026",
    targetRevenue: 2800000,
    committedRevenue: 1200000,
    bestCase: 2400000,
    worstCase: 1050000,
    actualRevenue: 0,
    progress: 0,
    owner: "Jane Doe",
    dealsCount: 38,
    status: "Planning",
    initials: "Q2",
  },
  {
    id: 3,
    period: "Feb 2026",
    startDate: "Feb 1, 2026",
    endDate: "Feb 28, 2026",
    targetRevenue: 850000,
    committedRevenue: 680000,
    bestCase: 780000,
    worstCase: 620000,
    actualRevenue: 250000,
    progress: 29,
    owner: "Mike Johnson",
    dealsCount: 18,
    status: "On Track",
    initials: "F26",
  },
  {
    id: 4,
    period: "Mar 2026",
    startDate: "Mar 1, 2026",
    endDate: "Mar 31, 2026",
    targetRevenue: 920000,
    committedRevenue: 520000,
    bestCase: 850000,
    worstCase: 480000,
    actualRevenue: 0,
    progress: 0,
    owner: "Sarah Brown",
    dealsCount: 22,
    status: "Planning",
    initials: "M26",
  },
  {
    id: 5,
    period: "H1 2026",
    startDate: "Jan 1, 2026",
    endDate: "Jun 30, 2026",
    targetRevenue: 5300000,
    committedRevenue: 3050000,
    bestCase: 4600000,
    worstCase: 2700000,
    actualRevenue: 850000,
    progress: 16,
    owner: "John Smith",
    dealsCount: 83,
    status: "At Risk",
    initials: "H1",
  },
];

// In-memory storage
let forecastsStore = [...initialForecasts];
let nextId = Math.max(...forecastsStore.map((f) => f.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const forecastsApi = {
  getAll: async (): Promise<ForecastDisplay[]> => {
    await delay(300);
    return [...forecastsStore];
  },

  getById: async (id: number): Promise<ForecastDisplay | null> => {
    await delay(200);
    return forecastsStore.find((f) => f.id === id) || null;
  },

  create: async (data: Partial<ForecastDisplay>): Promise<ForecastDisplay> => {
    await delay(400);
    const newForecast: ForecastDisplay = {
      id: nextId++,
      period: data.period || "",
      startDate: data.startDate || "",
      endDate: data.endDate || "",
      targetRevenue: data.targetRevenue || 0,
      committedRevenue: data.committedRevenue || 0,
      bestCase: data.bestCase || 0,
      worstCase: data.worstCase || 0,
      actualRevenue: data.actualRevenue || 0,
      progress: data.targetRevenue
        ? Math.round(((data.actualRevenue || 0) / data.targetRevenue) * 100)
        : 0,
      owner: data.owner || "Unknown",
      dealsCount: data.dealsCount || 0,
      status: data.status || "Planning",
      initials:
        data.initials ||
        data.period?.substring(0, 2).toUpperCase() ||
        "??",
    };
    forecastsStore.push(newForecast);
    return newForecast;
  },

  update: async (id: number, data: Partial<ForecastDisplay>): Promise<ForecastDisplay> => {
    await delay(400);
    const index = forecastsStore.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error("Forecast not found");
    }
    const updated = {
      ...forecastsStore[index],
      ...data,
    };
    // Recalculate progress if revenue values changed
    if (data.actualRevenue !== undefined || data.targetRevenue !== undefined) {
      updated.progress = updated.targetRevenue
        ? Math.round((updated.actualRevenue / updated.targetRevenue) * 100)
        : 0;
    }
    forecastsStore[index] = updated;
    return forecastsStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    forecastsStore = forecastsStore.filter((f) => f.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    forecastsStore = forecastsStore.filter((f) => !ids.includes(f.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<ForecastDisplay>
  ): Promise<ForecastDisplay[]> => {
    await delay(600);
    const updated: ForecastDisplay[] = [];
    ids.forEach((id) => {
      const index = forecastsStore.findIndex((f) => f.id === id);
      if (index !== -1) {
        forecastsStore[index] = {
          ...forecastsStore[index],
          ...data,
        };
        // Recalculate progress if revenue values changed
        if (data.actualRevenue !== undefined || data.targetRevenue !== undefined) {
          forecastsStore[index].progress = forecastsStore[index].targetRevenue
            ? Math.round(
                (forecastsStore[index].actualRevenue / forecastsStore[index].targetRevenue) * 100
              )
            : 0;
        }
        updated.push(forecastsStore[index]);
      }
    });
    return updated;
  },
};
