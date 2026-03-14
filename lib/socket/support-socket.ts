"use client";

import { io, type Socket } from "socket.io-client";
import {
  API_BASE_URL,
  getStoredAdminToken,
  getStoredStudentToken,
} from "@/lib/api/client";

type SupportSocketScope = "admin" | "student";

const sockets = new Map<SupportSocketScope, Socket>();

function readSocketAuth(scope: SupportSocketScope) {
  if (scope === "admin") {
    return {
      token: getStoredAdminToken(),
    };
  }

  return {
    token: getStoredStudentToken(),
  };
}

export function getSupportSocket(scope: SupportSocketScope) {
  if (typeof window === "undefined") {
    return null;
  }

  const auth = readSocketAuth(scope);
  if (!auth.token) {
    return null;
  }

  const existingSocket = sockets.get(scope);
  const currentAuth = existingSocket?.auth as
    | { token?: string; tenantId?: string | null; scope?: SupportSocketScope }
    | undefined;

  if (existingSocket && currentAuth?.token === auth.token) {
    return existingSocket;
  }

  if (existingSocket) {
    existingSocket.disconnect();
    sockets.delete(scope);
  }

  const socket = io(API_BASE_URL, {
    transports: ["websocket"],
    autoConnect: true,
    auth: {
      token: auth.token,
      scope,
    },
  });

  sockets.set(scope, socket);
  return socket;
}

export function joinSupportTicketRoom(
  socket: Socket | null,
  ticketId: string,
) {
  if (!socket || !ticketId) return;
  socket.emit("support:join-ticket", { ticketId });
}

export function leaveSupportTicketRoom(
  socket: Socket | null,
  ticketId: string,
) {
  if (!socket || !ticketId) return;
  socket.emit("support:leave-ticket", { ticketId });
}

export function emitSupportTyping(
  socket: Socket | null,
  ticketId: string,
) {
  if (!socket || !ticketId) return;
  socket.emit("support:typing", { ticketId });
}

export function emitSupportStopTyping(
  socket: Socket | null,
  ticketId: string,
) {
  if (!socket || !ticketId) return;
  socket.emit("support:stop-typing", { ticketId });
}
