import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  contactsV2Api,
  contactsV2ExtApi,
  contactCompaniesV2Api,
  type ContactV2,
  type ContactV2ListItem,
  type ContactV2QueryParams,
  type MergeContactV2Params,
  type AddContactCompanyInput,
} from '@/lib/api/contactsV2';
import { createEntityV2QueryKeys, createEntityV2Hooks } from './useEntityV2';

export type { ContactV2Stats, MergeContactV2Result, MergeStrategy } from '@/lib/api/contactsV2';

export const contactsV2QueryKeys = createEntityV2QueryKeys('contactsV2');

const hooks = createEntityV2Hooks<ContactV2, ContactV2ListItem, ContactV2QueryParams>(
  contactsV2Api,
  contactsV2QueryKeys,
  'Contact',
  'Contacts',
);

export const useContactsV2 = hooks.useList;
export const useContactV2 = hooks.useDetail;
export const useContactsV2Stats = hooks.useStats;
export const useCreateContactV2 = hooks.useCreate;
export const useUpdateContactV2 = hooks.useUpdate;
export const useDeleteContactV2 = hooks.useDelete;
export const useBulkDeleteContactsV2 = hooks.useBulkDelete;
export const useBulkUpdateContactsV2 = hooks.useBulkUpdate;

export function useContactV2Options() {
  return useQuery({
    queryKey: [...contactsV2QueryKeys.all, 'options'],
    queryFn: async () => {
      const res = await contactsV2Api.list({ page_size: 200 } as ContactV2QueryParams);
      return (res.results || []).map((c) => ({
        value: c.id,
        label: c.display_name || c.entity_data?.first_name
          ? `${c.entity_data?.first_name || ''} ${c.entity_data?.last_name || ''}`.trim()
          : c.id,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMergeContactsV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: MergeContactV2Params) => contactsV2ExtApi.merge(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsV2QueryKeys.all });
      toast.success('Contacts merged successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to merge contacts');
    },
  });
}

export function useContactV2Timeline(contactId: string) {
  return useQuery({
    queryKey: [...contactsV2QueryKeys.all, contactId, 'timeline'],
    queryFn: () => contactsV2ExtApi.timeline(contactId),
    enabled: !!contactId,
  });
}

export function useContactCompaniesV2(contactId: string) {
  return useQuery({
    queryKey: [...contactsV2QueryKeys.all, contactId, 'companies'],
    queryFn: () => contactCompaniesV2Api.list(contactId),
    enabled: !!contactId,
  });
}

export function useAddContactCompanyV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: AddContactCompanyInput }) =>
      contactCompaniesV2Api.add(contactId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contactsV2QueryKeys.all });
      queryClient.invalidateQueries({ queryKey: [...contactsV2QueryKeys.all, variables.contactId, 'companies'] });
      toast.success('Company linked successfully');
    },
    onError: () => {
      toast.error('Failed to link company');
    },
  });
}

export function useRemoveContactCompanyV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, associationId }: { contactId: string; associationId: string }) =>
      contactCompaniesV2Api.remove(contactId, associationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contactsV2QueryKeys.all });
      queryClient.invalidateQueries({ queryKey: [...contactsV2QueryKeys.all, variables.contactId, 'companies'] });
      toast.success('Company unlinked');
    },
    onError: () => {
      toast.error('Failed to unlink company');
    },
  });
}
