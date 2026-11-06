import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient } from "../queryClient";
import {
  createPreferredRecipe,
  deletePreferredRecipe,
  fetchPreferredForRoast,
  fetchPreferredRecipe,
  fetchPreferredRecipes,
  updatePreferredRecipe,
} from "./preferred.service";
import type { PreferredRecipeUpdate } from "./preferred.types";

export const preferredKeys = {
  all: ["preferred"] as const,
  detail: (id: string) => [...preferredKeys.all, "detail", id] as const,
  list: () => [...preferredKeys.all, "list"] as const,
  forRoast: (roastId: string) => [...preferredKeys.all, "forRoast", roastId] as const,
};

export const preferredQueries = {
  detail: (id: string) =>
    queryOptions({ queryKey: preferredKeys.detail(id), queryFn: () => fetchPreferredRecipe(id) }),
  list: () => queryOptions({ queryKey: preferredKeys.list(), queryFn: fetchPreferredRecipes }),
  forRoast: (roastId: string) =>
    queryOptions({
      queryKey: preferredKeys.forRoast(roastId),
      queryFn: () => fetchPreferredForRoast(roastId),
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
