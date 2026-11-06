import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient } from "../queryClient";
import {
  createPreferredRecipe,
  deletePreferredRecipe,
  fetchPreferredRecipe,
  fetchPreferredRecipes,
  updatePreferredRecipe,
} from "./preferred.service";
import type { PreferredFilter, PreferredRecipeUpdate } from "./preferred.types";

export const preferredKeys = {
  all: ["preferred"] as const,
  detail: (id: string) => [...preferredKeys.all, "detail", id] as const,
  list: (filter: PreferredFilter) => [...preferredKeys.all, "list", filter] as const,
};

export const preferredQueries = {
  detail: (id: string) =>
    queryOptions({ queryKey: preferredKeys.detail(id), queryFn: () => fetchPreferredRecipe(id) }),
  list: (filter: PreferredFilter = {}) =>
    queryOptions({
      queryKey: preferredKeys.list(filter),
      queryFn: () => fetchPreferredRecipes(filter),
    }),
};

export function invalidatePreferred() {
  return queryClient.invalidateQueries({ queryKey: preferredKeys.all });
}

export const preferredMutations = {
  create: () =>
    mutationOptions({ mutationFn: createPreferredRecipe, onSuccess: invalidatePreferred }),
  update: () =>
    mutationOptions({
      mutationFn: ({ id, fields }: { id: string; fields: PreferredRecipeUpdate }) =>
        updatePreferredRecipe(id, fields),
      onSuccess: invalidatePreferred,
    }),
  remove: () =>
    mutationOptions({ mutationFn: deletePreferredRecipe, onSuccess: invalidatePreferred }),
};
