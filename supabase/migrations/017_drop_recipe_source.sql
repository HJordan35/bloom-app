-- Bloom: a preferred recipe no longer links back to the brew it was saved from (Preferred Recipes, R2)
-- It's a copy once saved. brews.preferred_recipe_id (brew → recipe) stays, for brews per recipe.

alter table preferred_recipes drop column source_brew_id;
