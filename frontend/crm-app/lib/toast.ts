import { toast } from "sonner";

/**
 * Show a success toast notification
 */
export function showSuccessToast(message: string) {
  toast.success(message);
}

/**
 * Show an error toast notification
 */
export function showErrorToast(message: string) {
  toast.error(message);
}

/**
 * Show a toast for successful delete operation
 */
export function showDeleteSuccessToast(entityName: string) {
  toast.success(`${entityName} deleted successfully`);
}

/**
 * Show a loading toast that can be updated
 * @returns The toast ID that can be used to update or dismiss the toast
 */
export function showLoadingToast(message: string) {
  return toast.loading(message);
}

/**
 * Update an existing toast to success
 */
export function updateToastToSuccess(toastId: string | number, message: string) {
  toast.success(message, { id: toastId });
}

/**
 * Update an existing toast to error
 */
export function updateToastToError(toastId: string | number, message: string) {
  toast.error(message, { id: toastId });
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

