"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchCodeforcesProblems, convertCodeforcesProblem } from "@/lib/api";
export function useCodeforcesCatalog() {
  const query = useQuery({
    queryKey: ["codeforces-catalog"],
    queryFn: async () => {
      const result = await fetchCodeforcesProblems();
      return result.problems.map((problem) =>
        convertCodeforcesProblem(
          problem,
          result.contestNames.get(problem.contestId),
          result.contestStarts.get(problem.contestId),
        ),
      );
    },
    staleTime: 3600000,
    retry: 1,
  });
  return {
    problems: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    reload: () => void query.refetch(),
  };
}
