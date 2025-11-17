import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchDesignations,
  createDesignation as apiCreateDesignation,
  updateDesignation as apiUpdateDesignation,
  deleteDesignation as apiDeleteDesignation,
} from "@/lib/api";

export type Designation = {
  id: string;
  name: string;
  department?: string;
  createdAt: string;
};

type DesignationContextValue = {
  designations: Designation[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addDesignation: (designation: { name: string; department?: string }) => Promise<void>;
  updateDesignation: (id: string, updates: { name?: string; department?: string }) => Promise<void>;
  deleteDesignation: (id: string) => Promise<void>;
};

const DesignationContext = createContext<DesignationContextValue | undefined>(undefined);

export const DesignationProvider = ({ children }: { children: ReactNode }) => {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDesignations();
      setDesignations(
        data.map((designation) => ({
          id: designation.id ?? designation._id ?? "",
          name: designation.name,
          department: designation.department ?? "General",
          createdAt: designation.createdAt,
        }))
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load designations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<DesignationContextValue>(
    () => ({
      designations,
      isLoading,
      error,
      refresh: load,
      addDesignation: async ({ name, department }) => {
        const created = await apiCreateDesignation({ name, department });
        setDesignations((prev) => [
          {
            id: created.id ?? created._id ?? "",
            name: created.name,
            department: created.department ?? "General",
            createdAt: created.createdAt,
          },
          ...prev,
        ]);
      },
      updateDesignation: async (id, updates) => {
        const updated = await apiUpdateDesignation(id, updates);
        setDesignations((prev) =>
          prev.map((designation) =>
            designation.id === id
              ? {
                  id: updated.id ?? updated._id ?? id,
                  name: updated.name,
                  department: updated.department ?? "General",
                  createdAt: updated.createdAt,
                }
              : designation
          )
        );
      },
      deleteDesignation: async (id) => {
        await apiDeleteDesignation(id);
        setDesignations((prev) => prev.filter((designation) => designation.id !== id));
      },
    }),
    [designations, isLoading, error, load]
  );

  return (
    <DesignationContext.Provider value={value}>{children}</DesignationContext.Provider>
  );
};

export const useDesignations = () => {
  const context = useContext(DesignationContext);
  if (!context) {
    throw new Error("useDesignations must be used within a DesignationProvider");
  }
  return context;
};


