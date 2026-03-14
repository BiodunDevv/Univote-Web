import { create } from "zustand";

type AdminChatWidgetState = {
  open: boolean;
  selectedTicketId: string | null;
  setOpen: (open: boolean) => void;
  setSelectedTicketId: (ticketId: string | null) => void;
  openTicket: (ticketId?: string | null) => void;
  close: () => void;
};

export const useAdminChatWidgetStore = create<AdminChatWidgetState>((set) => ({
  open: false,
  selectedTicketId: null,
  setOpen: (open) => set({ open }),
  setSelectedTicketId: (selectedTicketId) => set({ selectedTicketId }),
  openTicket: (selectedTicketId = null) =>
    set({
      open: true,
      selectedTicketId,
    }),
  close: () =>
    set({
      open: false,
      selectedTicketId: null,
    }),
}));
