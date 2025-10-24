-- Remover coluna calculated_cost da tabela recipes (será calculado dinamicamente)
ALTER TABLE recipes DROP COLUMN IF EXISTS calculated_cost;

-- Adicionar índice para melhor performance nas queries de recipe_ingredients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe 
ON recipe_ingredients(recipe_id);