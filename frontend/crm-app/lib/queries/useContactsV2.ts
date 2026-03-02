import { contactsV2Api, type ContactV2, type ContactV2ListItem, type ContactV2QueryParams } from '@/lib/api/contactsV2';
import { createEntityV2QueryKeys, createEntityV2Hooks } from './useEntityV2';

export type { ContactV2Stats } from '@/lib/api/contactsV2';

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
