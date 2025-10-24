import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, BookText, Trash2, Pencil } from "lucide-react";
import QuickIngredientInput from "@/components/kitchen/QuickIngredientInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Ingredient {
  id: string;
  name: string;
  unit_of_measure: string;
  unit_cost: number;
}

interface RecipeIngredient {
  id?: string; // Optional for new associations
  ingredient_id: string;
  name: string; // For display
  unit_of_measure: string; // For display
  unit_cost: number; // For calculation
  quantity_used: number;
}

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  yield_quantity: number;
  calculated_cost?: number; // Calculado dinamicamente
}

export default function RecipesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    yield_quantity: "1",
  });
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);

  const calculateRecipeCost = useCallback((ingredients: RecipeIngredient[]) => {
    return ingredients.reduce((total, item) => total + (item.unit_cost * item.quantity_used), 0);
  }, []);

  const loadIngredients = async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar ingredientes disponíveis",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAvailableIngredients(data || []);
    }
  };

  const loadRecipes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar receitas",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Calcular custo dinâmico para cada receita
    const recipesWithCost = await Promise.all(
      (data || []).map(async (recipe) => {
        const { data: ingredients } = await supabase
          .from("recipe_ingredients")
          .select(`
            quantity_used,
            ingredients (unit_cost)
          `)
          .eq("recipe_id", recipe.id);

        const currentCost = (ingredients || []).reduce((sum, item: any) => 
          sum + (item.quantity_used * item.ingredients.unit_cost), 0
        );

        return {
          ...recipe,
          calculated_cost: currentCost
        };
      })
    );

    setRecipes(recipesWithCost);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadRecipes();
      loadIngredients();
    }
  }, [user]);

  const resetForm = () => {
    setFormData({ name: "", description: "", yield_quantity: "1" });
    setRecipeIngredients([]);
    setCurrentRecipe(null);
    setIsEditing(false);
  };

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const yieldQty = parseInt(formData.yield_quantity);
    if (isNaN(yieldQty) || yieldQty < 1) {
      toast({
        title: "Erro",
        description: "O rendimento deve ser um número inteiro positivo.",
        variant: "destructive",
      });
      return;
    }

    // Calcular quantidades unitárias dividindo as quantidades totais pelo rendimento
    const unitaryIngredients = recipeIngredients.map(item => ({
      ...item,
      quantity_used: item.quantity_used / yieldQty
    }));

    // Não salvamos calculated_cost - será calculado dinamicamente
    const recipePayload = {
      name: formData.name,
      description: formData.description,
      yield_quantity: yieldQty,
      user_id: user.id,
    };

    let recipeId: string;
    if (isEditing && currentRecipe) {
      const { data, error } = await supabase
        .from("recipes")
        .update(recipePayload)
        .eq("id", currentRecipe.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao atualizar receita",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      recipeId = data.id;
      toast({
        title: "Receita atualizada!",
        description: "A receita foi atualizada com sucesso.",
      });
    } else {
      const { data, error } = await supabase.from("recipes").insert([recipePayload]).select().single();

      if (error) {
        toast({
          title: "Erro ao adicionar receita",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      recipeId = data.id;
      toast({
        title: "Receita adicionada!",
        description: "A receita foi adicionada com sucesso.",
      });
    }

    // Update recipe_ingredients
    const existingRecipeIngredientIds = new Set(
      recipeIngredients.filter(ri => ri.id).map(ri => ri.id)
    );

    // Delete removed ingredients
    if (isEditing && currentRecipe) {
      const { data: oldRecipeIngredients } = await supabase
        .from("recipe_ingredients")
        .select("id")
        .eq("recipe_id", currentRecipe.id);
      
      const oldIds = new Set(oldRecipeIngredients?.map(ri => ri.id));
      const toDelete = Array.from(oldIds).filter(id => !existingRecipeIngredientIds.has(id));

      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("recipe_ingredients")
          .delete()
          .in("id", toDelete);
        if (deleteError) {
          toast({
            title: "Erro ao remover ingredientes antigos",
            description: deleteError.message,
            variant: "destructive",
          });
        }
      }
    }

    // Insert new and update existing ingredients (usando quantidades unitárias)
    for (const item of unitaryIngredients) {
      const ingredientPayload = {
        recipe_id: recipeId,
        ingredient_id: item.ingredient_id,
        quantity_used: item.quantity_used,
      };

      if (item.id) { // Existing recipe ingredient
        const { error } = await supabase
          .from("recipe_ingredients")
          .update(ingredientPayload)
          .eq("id", item.id);
        if (error) {
          toast({
            title: "Erro ao atualizar ingrediente da receita",
            description: error.message,
            variant: "destructive",
          });
        }
      } else { // New recipe ingredient
        const { error } = await supabase
          .from("recipe_ingredients")
          .insert([ingredientPayload]);
        if (error) {
          toast({
            title: "Erro ao adicionar ingrediente à receita",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    }

    setIsDialogOpen(false);
    resetForm();
    loadRecipes();
  };

  const handleEditClick = async (recipe: Recipe) => {
    setLoading(true);
    setCurrentRecipe(recipe);
    setFormData({
      name: recipe.name,
      description: recipe.description || "",
      yield_quantity: recipe.yield_quantity.toString(),
    });
    setIsEditing(true);

    const { data, error } = await supabase
      .from("recipe_ingredients")
      .select(`
        id,
        quantity_used,
        ingredients (
          id,
          name,
          unit_of_measure,
          unit_cost
        )
      `)
      .eq("recipe_id", recipe.id);

    if (error) {
      toast({
        title: "Erro ao carregar ingredientes da receita",
        description: error.message,
        variant: "destructive",
      });
      setRecipeIngredients([]);
    } else {
      // Converter quantidades unitárias para quantidades totais para exibição
      const loadedRecipeIngredients: RecipeIngredient[] = data.map((ri: any) => ({
        id: ri.id,
        ingredient_id: ri.ingredients.id,
        name: ri.ingredients.name,
        unit_of_measure: ri.ingredients.unit_of_measure,
        unit_cost: ri.ingredients.unit_cost,
        quantity_used: ri.quantity_used * recipe.yield_quantity, // Converter para quantidade total
      }));
      setRecipeIngredients(loadedRecipeIngredients);
    }
    setLoading(false);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta receita? Isso também removerá todos os ingredientes associados a ela.")) return;

    const { error } = await supabase.from("recipes").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir receita",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Receita excluída",
        description: "A receita foi removida com sucesso.",
      });
      loadRecipes();
    }
  };


  const yieldQty = parseInt(formData.yield_quantity) || 1;
  const currentRecipeTotalCost = calculateRecipeCost(recipeIngredients.map(item => ({
    ...item,
    quantity_used: item.quantity_used / yieldQty
  })));
  const currentRecipeUnitCost = currentRecipeTotalCost;

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Receitas</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4" />
              Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Receita" : "Adicionar Nova Receita"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Atualize os detalhes da receita e seus ingredientes." : "Adicione uma nova receita e defina seus ingredientes."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Receita</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Bolo de Cenoura"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrição da receita..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yield_quantity">Rendimento (unidades produzidas)</Label>
                <Input
                  id="yield_quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.yield_quantity}
                  onChange={(e) => setFormData({ ...formData, yield_quantity: e.target.value })}
                  placeholder="Ex: 40 fatias"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Quantas unidades esta receita produz? (ex: 40 fatias, 30 porções)
                </p>
              </div>

              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold">Ingredientes da Receita</h3>
                <p className="text-sm text-muted-foreground">
                  Informe as quantidades TOTAIS necessárias para fazer {formData.yield_quantity} unidade(s)
                </p>

                <QuickIngredientInput
                  availableIngredients={availableIngredients}
                  recipeIngredients={recipeIngredients}
                  onIngredientsChange={setRecipeIngredients}
                  yieldQuantity={yieldQty}
                />

                {recipeIngredients.length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Custo Total do Lote:</span>
                      <span className="text-lg font-semibold">R$ {(currentRecipeTotalCost * yieldQty).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Rendimento:</span>
                      <span className="font-medium">{yieldQty} unidade(s)</span>
                    </div>
                    <div className="border-t border-primary/20 pt-2 flex justify-between items-center">
                      <span className="text-lg font-semibold text-primary">Custo por Unidade:</span>
                      <span className="text-2xl font-bold text-primary">R$ {currentRecipeUnitCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <Button type="submit" className="flex-1 bg-gradient-primary hover:opacity-90">
                  {isEditing ? "Salvar Alterações" : "Adicionar Receita"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando receitas...</p>
        ) : recipes.length === 0 ? (
          <div className="py-12 text-center">
            <BookText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground mb-2">
              Nenhuma receita cadastrada
            </p>
            <p className="text-muted-foreground">
              Adicione sua primeira receita para começar a gerenciar seus pratos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Rendimento</TableHead>
                  <TableHead className="text-right">Custo/Unidade</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((recipe) => {
                  const totalCost = Number(recipe.calculated_cost || 0) * recipe.yield_quantity;
                  const unitCost = Number(recipe.calculated_cost || 0);
                  return (
                    <TableRow key={recipe.id}>
                      <TableCell className="font-medium">{recipe.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {recipe.description || "Sem descrição"}
                      </TableCell>
                      <TableCell className="text-right">
                        {recipe.yield_quantity} unid.
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        R$ {unitCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        R$ {totalCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(recipe)}
                          className="text-primary hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recipe.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}