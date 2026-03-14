"use client";

import { useEffect } from "react";
import { decodeTenantHandoffPayload } from "@/lib/tenant";
import {
  clearSharedAdminContext,
  type SharedAdminContext,
  writeSharedAdminContext,
} from "@/lib/shared-admin-context";

function getSharedPayloadFromHash(hash: string) {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(fragment);
  return params.get("shared");
}

export default function AuthContextSyncPage() {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("clear") === "1") {
      clearSharedAdminContext({ syncToRoot: false });
      return;
    }

    const payload = getSharedPayloadFromHash(window.location.hash);
    if (!payload) return;

    try {
      const context = decodeTenantHandoffPayload<SharedAdminContext>(payload);
      if (!context?.admin?.full_name || !Array.isArray(context.organizations)) {
        return;
      }

      writeSharedAdminContext(context, { syncToRoot: false });
    } catch {
      return;
    }
  }, []);

  return <div className="sr-only">Syncing organisation context</div>;
}
