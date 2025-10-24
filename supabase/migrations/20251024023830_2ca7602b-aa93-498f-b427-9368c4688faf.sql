-- Kitchen Management Tables Migration

-- 1. Criar tabela de ingredientes
CREATE TABLE IF NOT EXISTS public.ingredients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    unit_of_measure text NOT NULL,
    unit_cost numeric DEFAULT 0 NOT NULL
);

-- 2. Criar tabela de receitas com campo de rendimento
CREATE TABLE IF NOT EXISTS public.recipes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    calculated_cost numeric DEFAULT 0 NOT NULL,
    yield_quantity integer NOT NULL DEFAULT 1
);

-- 3. Criar tabela de ingredientes por receita
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity_used numeric DEFAULT 0 NOT NULL
);

-- 4. Criar tabela de itens do menu
CREATE TABLE IF NOT EXISTS public.menu_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
    base_cost numeric DEFAULT 0 NOT NULL,
    suggested_price numeric DEFAULT 0 NOT NULL,
    category text
);

-- 5. Habilitar RLS em todas as tabelas
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para ingredients
DROP POLICY IF EXISTS "Users view own ingredients" ON public.ingredients;
CREATE POLICY "Users view own ingredients"
  ON public.ingredients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own ingredients" ON public.ingredients;
CREATE POLICY "Users insert own ingredients"
  ON public.ingredients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own ingredients" ON public.ingredients;
CREATE POLICY "Users update own ingredients"
  ON public.ingredients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own ingredients" ON public.ingredients;
CREATE POLICY "Users delete own ingredients"
  ON public.ingredients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. Políticas RLS para recipes
DROP POLICY IF EXISTS "Users view own recipes" ON public.recipes;
CREATE POLICY "Users view own recipes"
  ON public.recipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own recipes" ON public.recipes;
CREATE POLICY "Users insert own recipes"
  ON public.recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own recipes" ON public.recipes;
CREATE POLICY "Users update own recipes"
  ON public.recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own recipes" ON public.recipes;
CREATE POLICY "Users delete own recipes"
  ON public.recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. Políticas RLS para recipe_ingredients
DROP POLICY IF EXISTS "Users view recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Users view recipe ingredients"
  ON public.recipe_ingredients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users insert recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Users insert recipe ingredients"
  ON public.recipe_ingredients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users update recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Users update recipe ingredients"
  ON public.recipe_ingredients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users delete recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Users delete recipe ingredients"
  ON public.recipe_ingredients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- 9. Políticas RLS para menu_items
DROP POLICY IF EXISTS "Users view own menu items" ON public.menu_items;
CREATE POLICY "Users view own menu items"
  ON public.menu_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own menu items" ON public.menu_items;
CREATE POLICY "Users insert own menu items"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own menu items" ON public.menu_items;
CREATE POLICY "Users update own menu items"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own menu items" ON public.menu_items;
CREATE POLICY "Users delete own menu items"
  ON public.menu_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);