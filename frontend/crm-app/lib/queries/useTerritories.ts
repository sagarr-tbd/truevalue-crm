import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  territoriesApi,
  type TerritoryItem,
  type TerritoryHierarchy,
  type TerritoryDetail,
  type CreateTerritoryData,
  type UpdateTerritoryData,
  type TerritoryUserAssignment,
  type TerritoryAccountAssignment,
  type AssignUserData,
  type AssignAccountData,
} from '@/lib/api/territories-api';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const territoryKeys = {
  all: ['territories'] as const,
  lists: () => [...territoryKeys.all, 'list'] as const,
  list: (activeOnly?: boolean) => [...territoryKeys.lists(), activeOnly] as const,
  hierarchy: () => [...territoryKeys.all, 'hierarchy'] as const,
  details: () => [...territoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...territoryKeys.details(), id] as const,
  users: (territoryId: string) => [...territoryKeys.all, 'users', territoryId] as const,
  accounts: (territoryId: string) => [...territoryKeys.all, 'accounts', territoryId] as const,
  userTerritories: (userId: string) => [...territoryKeys.all, 'user', userId] as const,
  myTerritories: () => [...territoryKeys.all, 'me'] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch all territories (flat list).
 */
export function useTerritories(activeOnly = true) {
  return useQuery<TerritoryItem[]>({
    queryKey: territoryKeys.list(activeOnly),
    queryFn: () => territoriesApi.listTerritories(activeOnly),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch territory hierarchy (tree structure).
 */
export function useTerritoryHierarchy() {
  return useQuery<TerritoryHierarchy[]>({
    queryKey: territoryKeys.hierarchy(),
    queryFn: () => territoriesApi.getHierarchy(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single territory with details.
 */
export function useTerritoryDetail(territoryId: string | null) {
  return useQuery<TerritoryDetail | null>({
    queryKey: territoryKeys.detail(territoryId!),
    queryFn: () => territoriesApi.getTerritory(territoryId!),
    enabled: !!territoryId,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch users assigned to a territory.
 */
export function useTerritoryUsers(territoryId: string | null) {
  return useQuery<TerritoryUserAssignment[]>({
    queryKey: territoryKeys.users(territoryId!),
    queryFn: () => territoriesApi.getTerritoryUsers(territoryId!),
    enabled: !!territoryId,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch accounts assigned to a territory.
 */
export function useTerritoryAccounts(territoryId: string | null) {
  return useQuery<TerritoryAccountAssignment[]>({
    queryKey: territoryKeys.accounts(territoryId!),
    queryFn: () => territoriesApi.getTerritoryAccounts(territoryId!),
    enabled: !!territoryId,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch territories for a user.
 */
export function useUserTerritories(userId: string | null) {
  return useQuery<TerritoryItem[]>({
    queryKey: territoryKeys.userTerritories(userId!),
    queryFn: () => territoriesApi.getUserTerritories(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch current user's territories.
 */
export function useMyTerritories() {
  return useQuery<TerritoryItem[]>({
    queryKey: territoryKeys.myTerritories(),
    queryFn: () => territoriesApi.getMyTerritories(),
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new territory.
 */
export function useCreateTerritory() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTerritoryData) => territoriesApi.createTerritory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: territoryKeys.lists() });
      qc.invalidateQueries({ queryKey: territoryKeys.hierarchy() });
    },
  });
}

/**
 * Update an existing territory.
 */
export function useUpdateTerritory() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: ({ territoryId, data }: { territoryId: string; data: UpdateTerritoryData }) =>
      territoriesApi.updateTerritory(territoryId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: territoryKeys.detail(vars.territoryId) });
      qc.invalidateQueries({ queryKey: territoryKeys.lists() });
      qc.invalidateQueries({ queryKey: territoryKeys.hierarchy() });
    },
  });
}

/**
 * Delete a territory.
 */
export function useDeleteTerritory() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (territoryId: string) => territoriesApi.deleteTerritory(territoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: territoryKeys.lists() });
      qc.invalidateQueries({ queryKey: territoryKeys.hierarchy() });
    },
  });
}

/**
 * Assign a user to a territory.
 */
export function useAssignTerritoryUser() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: ({ territoryId, data }: { territoryId: string; data: AssignUserData }) =>
      territoriesApi.assignUser(territoryId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: territoryKeys.users(vars.territoryId) });
      qc.invalidateQueries({ queryKey: territoryKeys.detail(vars.territoryId) });
    },
  });
}

/**
 * Remove a user from a territory.
 */
export function useRemoveTerritoryUser() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: ({ territoryId, userId }: { territoryId: string; userId: string }) =>
      territoriesApi.removeUser(territoryId, userId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: territoryKeys.users(vars.territoryId) });
      qc.invalidateQueries({ queryKey: territoryKeys.detail(vars.territoryId) });
    },
  });
}

/**
 * Assign an account to a territory.
 */
export function useAssignTerritoryAccount() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: ({ territoryId, data }: { territoryId: string; data: AssignAccountData }) =>
      territoriesApi.assignAccount(territoryId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: territoryKeys.accounts(vars.territoryId) });
      qc.invalidateQueries({ queryKey: territoryKeys.detail(vars.territoryId) });
    },
  });
}

/**
 * Remove an account from a territory.
 */
export function useRemoveTerritoryAccount() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: ({ territoryId, accountId }: { territoryId: string; accountId: string }) =>
      territoriesApi.removeAccount(territoryId, accountId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: territoryKeys.accounts(vars.territoryId) });
      qc.invalidateQueries({ queryKey: territoryKeys.detail(vars.territoryId) });
    },
  });
}
