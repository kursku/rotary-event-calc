import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (user) {
      loadRecipes();
    }
  }, [user]);

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

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setCurrentRecipe(null);
    setIsEditing(false);
  };

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      name: formData.name,
      description: formData.description,
      user_id: user.id,
    };

    if (isEditing && currentRecipe) {
      const { error } = await supabase
        .from("recipes")
        .update(payload)
        .eq("id", currentRecipe.id);

      if (error) {
        toast({
          title: "Erro ao atualizar receita",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Receita atualizada!",
          description: "A receita foi atualizada com sucesso.",
        });
        setIsDialogOpen(false);
        resetForm();
        loadRecipes();
      }
    } else {
      const { error } = await supabase.from("recipes").insert([payload]);

      if (error) {
        toast({
          title: "Erro ao adicionar receita",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Receita adicionada!",
          description: "A receita foi adicionada com sucesso.",
        });
        setIsDialogOpen(false);
        resetForm();
        loadRecipes();
      }
    }
  };

  const handleEditClick = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    setFormData({
      name: recipe.name,
      description: recipe.description || "",
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta receita?")) return;

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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Receita" : "Adicionar Nova Receita"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Atualize os detalhes da receita." : "Adicione uma nova receita para o seu cardápio."}
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

              <div className="flex gap-2">
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