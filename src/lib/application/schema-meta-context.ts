import type { SchemaMeta } from "@/lib/application/form-schema";
import { createContext, useContext } from "react";

export const ApplicationSchemaMetaContext = createContext<SchemaMeta | null>(null);

export function useApplicationSchemaMeta(): SchemaMeta | null {
  return useContext(ApplicationSchemaMetaContext);
}
