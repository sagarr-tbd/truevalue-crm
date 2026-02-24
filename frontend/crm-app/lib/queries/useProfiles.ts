import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  profilesApi,
  type ProfileItem,
  type ProfileDetail,
  type CreateProfileData,
  type UpdateProfileData,
  type CloneProfileData,
  type ProfileAssignment,
} from '@/lib/api/profiles-api';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (filters?: { includeSystem?: boolean; activeOnly?: boolean }) =>
    [...profileKeys.lists(), filters] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  assignments: () => [...profileKeys.all, 'assignments'] as const,
  userProfile: (userId: string) => [...profileKeys.all, 'user', userId] as const,
  myProfile: () => [...profileKeys.all, 'me'] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch all profiles for the organization.
 */
export function useProfiles(includeSystem = true, activeOnly = true) {
  return useQuery<ProfileItem[]>({
    queryKey: profileKeys.list({ includeSystem, activeOnly }),
    queryFn: () => profilesApi.listProfiles(includeSystem, activeOnly),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single profile with full permission details.
 */
export function useProfileDetail(profileId: string | null) {
  return useQuery<ProfileDetail | null>({
    queryKey: profileKeys.detail(profileId!),
    queryFn: () => profilesApi.getProfile(profileId!),
    enabled: !!profileId,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch all profile assignments.
 */
export function useProfileAssignments() {
  return useQuery<ProfileAssignment[]>({
    queryKey: profileKeys.assignments(),
    queryFn: () => profilesApi.listAssignments(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a user's profile.
 */
export function useUserProfile(userId: string | null) {
  return useQuery<ProfileItem | null>({
    queryKey: profileKeys.userProfile(userId!),
    queryFn: () => profilesApi.getUserProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch current user's profile.
 */
export function useMyProfile() {
  return useQuery<ProfileItem | null>({
    queryKey: profileKeys.myProfile(),
    queryFn: () => profilesApi.getMyProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new profile.
 */
export function useCreateProfile() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProfileData) => profilesApi.createProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}

/**
 * Update an existing profile.
 */
export function useUpdateProfile() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: UpdateProfileData }) =>
      profilesApi.updateProfile(profileId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: profileKeys.detail(vars.profileId) });
      qc.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}

/**
 * Delete a profile.
 */
export function useDeleteProfile() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (profileId: string) => profilesApi.deleteProfile(profileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.lists() });
      qc.invalidateQueries({ queryKey: profileKeys.assignments() });
    },
  });
}

/**
 * Clone a profile.
 */
export function useCloneProfile() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CloneProfileData) => profilesApi.cloneProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}

/**
 * Assign a profile to a user.
 */
export function useAssignProfile() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, profileId }: { userId: string; profileId: string }) =>
      profilesApi.assignProfile(userId, profileId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: profileKeys.assignments() });
      qc.invalidateQueries({ queryKey: profileKeys.userProfile(vars.userId) });
    },
  });
}
