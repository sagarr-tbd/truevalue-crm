"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { accountFormConfig } from "@/components/Forms/configs";
import type { Account } from "@/lib/types";

export interface AccountFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Account>) => Promise<void>;
  initialData?: Partial<Account> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function AccountFormDrawer(props: AccountFormDrawerProps) {
  return <FormDrawer<Account> {...props} config={accountFormConfig} />;
}
