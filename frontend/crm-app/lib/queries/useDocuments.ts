import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api/documents";
import type { DocumentDisplay } from "@/lib/api/mock/documents";
import { toast } from "sonner";

// Query keys
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (filters: string) => [...documentKeys.lists(), { filters }] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: number) => [...documentKeys.details(), id] as const,
};

// Queries
export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.lists(),
    queryFn: () => documentsApi.getAll(),
  });
}

export function useDocument(id: number) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsApi.getById(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<DocumentDisplay>) => documentsApi.create(data),
    onMutate: async (newDocument) => {
      await queryClient.cancelQueries({ queryKey: documentKeys.lists() });
      const previousDocuments = queryClient.getQueryData(documentKeys.lists());

      queryClient.setQueryData(documentKeys.lists(), (old: DocumentDisplay[] = []) => [
        ...old,
        { ...newDocument, id: Date.now(), initials: "??" } as DocumentDisplay,
      ]);

      return { previousDocuments };
    },
    onError: (_err, _newDocument, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(documentKeys.lists(), context.previousDocuments);
      }
      toast.error("Failed to create document");
    },
    onSuccess: () => {
      toast.success("Document created successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DocumentDisplay> }) =>
      documentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success("Document updated successfully");
    },
    onError: () => {
      toast.error("Failed to update document");
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success("Document deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete document");
    },
  });
}

export function useBulkDeleteDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => documentsApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success("Documents deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete documents");
    },
  });
}

export function useBulkUpdateDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<DocumentDisplay> }) =>
      documentsApi.bulkUpdate(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success("Documents updated successfully");
    },
    onError: () => {
      toast.error("Failed to update documents");
    },
  });
}
