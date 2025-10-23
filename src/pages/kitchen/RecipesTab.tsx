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
import { Plus, BookText, Trash2, Pencil, X } from "lucide-react";
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
  calculated_cost: number;
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
  });
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [newIngredientId, setNewIngredientId] = useState<string>("");
  const [newIngredientQuantity, setNewIngredientQuantity] = useState<string>("1");

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
    } else {
      setRecipes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadRecipes();
      loadIngredients();
    }
  }, [user]);

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setRecipeIngredients([]);
    setNewIngredientId("");
    setNewIngredientQuantity("1");
    setCurrentRecipe(null);
    setIsEditing(false);
  };

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const calculated_cost = calculateRecipeCost(recipeIngredients);

    const recipePayload = {
      name: formData.name,
      description: formData.description,
      calculated_cost: calculated_cost,
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

    // Insert new and update existing ingredients
    for (const item of recipeIngredients) {
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
      const loadedRecipeIngredients: RecipeIngredient[] = data.map((ri: any) => ({
        id: ri.id,
        ingredient_id: ri.ingredients.id,
        name: ri.ingredients.name,
        unit_of_measure: ri.ingredients.unit_of_measure,
        unit_cost: ri.ingredients.unit_cost,
        quantity_used: ri.quantity_used,
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

  const handleAddIngredientToRecipe = () => {
    if (!newIngredientId || !newIngredientQuantity) {
      toast({
        title: "Erro",
        description: "Selecione um ingrediente e insira uma quantidade.",
        variant: "destructive",
      });
      return;
    }

    const ingredient = availableIngredients.find(ing => ing.id === newIngredientId);
    if (ingredient) {
      const quantity = parseFloat(newIngredientQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast({
          title: "Erro",
          description: "A quantidade deve ser um número positivo.",
          variant: "destructive",
        });
        return;
      }

      // Check if ingredient already exists in recipeIngredients
      const existingIndex = recipeIngredients.findIndex(ri => ri.ingredient_id === newIngredientId);
      if (existingIndex > -1) {
        // Update existing ingredient quantity
        const updatedIngredients = [...recipeIngredients];
        updatedIngredients[existingIndex].quantity_used = quantity;
        setRecipeIngredients(updatedIngredients);
      } else {
        // Add new ingredient
        setRecipeIngredients(prev => [
          ...prev,
          {
            ingredient_id: ingredient.id,
            name: ingredient.name,
            unit_of_measure: ingredient.unit_of_measure,
            unit_cost: ingredient.unit_cost,
            quantity_used: quantity,
          },
        ]);
      }

      setNewIngredientId("");
      setNewIngredientQuantity("1");
    }
  };

  const handleRemoveIngredientFromRecipe = (ingredientId: string) => {
    setRecipeIngredients(prev => prev.filter(item => item.ingredient_id !== ingredientId));
  };

  const currentRecipeTotalCost = calculateRecipeCost(recipeIngredients);

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

              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold">Ingredientes da Receita</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="new-ingredient">Ingrediente</Label>
                    <Select
                      value={newIngredientId}
                      onValueChange={setNewIngredientId}
                    >
                      <SelectTrigger id="new-ingredient">
                        <SelectValue placeholder="Selecione um ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIngredients.map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} ({ingredient.unit_of_measure})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-quantity">Quantidade</Label>
                    <Input
                      id="new-quantity"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newIngredientQuantity}
                      onChange={(e) => setNewIngredientQuantity(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddIngredientToRecipe}
                  className="w-full bg-secondary hover:opacity-90 text-secondary-foreground"
                >
                  Adicionar Ingrediente
                </Button>

                {recipeIngredients.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Ingredientes Adicionados:</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Custo Unit.</TableHead>
                          <TableHead className="text-right">Custo Total</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipeIngredients.map((item) => (
                          <TableRow key={item.ingredient_id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">
                              {item.quantity_used} {item.unit_of_measure}
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {item.unit_cost.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              R$ {(item.unit_cost * item.quantity_used).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveIngredientFromRecipe(item.ingredient_id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-end mt-4 text-lg font-bold">
                      Custo Total da Receita: R$ {currentRecipeTotalCost.toFixed(2)}
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
                  <TableHead className="text-right">Custo Calculado</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">{recipe.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {recipe.description || "Sem descrição"}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {Number(recipe.calculated_cost || 0).toFixed(2)}
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}