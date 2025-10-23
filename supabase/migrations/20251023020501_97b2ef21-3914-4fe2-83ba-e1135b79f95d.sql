-- Existing migrations...

-- Add new tables for Kitchen/Recipe Module
CREATE TABLE public.ingredients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    unit_of_measure text NOT NULL,
    unit_cost numeric DEFAULT 0 NOT NULL,
    CONSTRAINT ingredients_pkey PRIMARY KEY (id),
    CONSTRAINT ingredients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.recipes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    calculated_cost numeric DEFAULT 0 NOT NULL,
    CONSTRAINT recipes_pkey PRIMARY KEY (id),
    CONSTRAINT recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.recipe_ingredients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    recipe_id uuid NOT NULL,
    ingredient_id uuid NOT NULL,
    quantity_used numeric DEFAULT 0 NOT NULL,
    CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (id),
    CONSTRAINT recipe_ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE,
    CONSTRAINT recipe_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE
);

CREATE TABLE public.menu_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    recipe_id uuid,
    base_cost numeric DEFAULT 0 NOT NULL,
    suggested_price numeric DEFAULT 0 NOT NULL,
    category text,
    CONSTRAINT menu_items_pkey PRIMARY KEY (id),
    CONSTRAINT menu_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT menu_items_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE SET NULL
);