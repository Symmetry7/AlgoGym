"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { jsonRequest } from "./use-account";
import type { StudyData, SheetDetail } from "@/lib/study-types";
export function useStudy() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["study", user?.id],
    queryFn: () => jsonRequest<StudyData>("/api/study"),
    enabled: Boolean(user),
    staleTime: 30000,
    retry: 1,
  });
  const mutation = useMutation({
    mutationFn: (action: Record<string, unknown>) =>
      jsonRequest<{ saved: true; id?: string }>("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      }),
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["study", user?.id] }),
        cache.invalidateQueries({ queryKey: ["study-sheet", user?.id] }),
      ]);
    },
  });
  return {
    ...query,
    save: mutation.mutateAsync,
    saving: mutation.isPending,
    saveError: mutation.error,
    resetSaveError: mutation.reset,
  };
}
export function useStudySheet(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["study-sheet", user?.id, id],
    queryFn: () =>
      jsonRequest<SheetDetail>(`/api/study?sheetId=${encodeURIComponent(id)}`),
    enabled: Boolean(user && id),
    staleTime: 30000,
    retry: 1,
  });
}
