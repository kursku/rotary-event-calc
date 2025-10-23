import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Utensils, Trash2, Pencil } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  unit_of_measure: string;
  unit_cost: number;
}

export default function IngredientsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    unit_of_measure: "",
    unit_cost: "",
  });

  useEffect(() => {
    if (user) {
      loadIngredients();
    }
  }, [user]);

  const loadIngredients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar ingredientes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIngredients(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: "", unit_of_measure: "", unit_cost: "" });
    setCurrentIngredient(null);
    setIsEditing(false);
  };

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      name: formData.name,
      unit_of_measure: formData.unit_of_measure,
      unit_cost: parseFloat(formData.unit_cost),
      user_id: user.id,
    };

    if (isEditing && currentIngredient) {
      const { error } = await supabase
        .from("ingredients")
        .update(payload)
        .eq("id", currentIngredient.id);

      if (error) {
        toast({
          title: "Erro ao atualizar ingrediente",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ingrediente atualizado!",
          description: "O ingrediente foi atualizado com sucesso.",
        });
        setIsDialogOpen(false);
        resetForm();
        loadIngredients();
      }
    } else {
      const { error } = await supabase.from("ingredients").insert([payload]);

      if (error) {
        toast({
          title: "Erro ao adicionar ingrediente",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ingrediente adicionado!",
          description: "O ingrediente foi adicionado com sucesso.",
        });
        setIsDialogOpen(false);
        resetForm();
        loadIngredients();
      }
    }
  };

  const handleEditClick = (ingredient: Ingredient) => {
    setCurrentIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      unit_of_measure: ingredient.unit_of_measure,
      unit_cost: ingredient.unit_cost.toString(),
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ingrediente?")) return;

    const { error } = await supabase.from("ingredients").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir ingrediente",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Ingrediente excluído",
        description: "O ingrediente foi removido com sucesso.",
      });
      loadIngredients();
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Ingredientes</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4" />
              Novo Ingrediente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Ingrediente" : "Adicionar Novo Ingrediente"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Atualize os detalhes do ingrediente." : "Adicione um novo ingrediente para suas receitas."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Ingrediente</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Farinha de Trigo"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit_of_measure">Unidade de Medida</Label>
                <Input
                  id="unit_of_measure"
                  value={formData.unit_of_measure}
                  onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                  placeholder="Ex: kg, litro, unidade"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_cost">Custo Unitário (R$)</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-gradient-primary hover:opacity-90">
                  {isEditing ? "Salvar Alterações" : "Adicionar Ingrediente"}
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
          <p className="text-center text-muted-foreground py-8">Carregando ingredientes...</p>
        ) : ingredients.length === 0 ? (
          <div className="py-12 text-center">
            <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground mb-2">
              Nenhum ingrediente cadastrado
            </p>
            <p className="text-muted-foreground">
              Adicione seu primeiro ingrediente para começar a criar receitas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Custo Unit.</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>{ingredient.unit_of_measure}</TableCell>
                    <TableCell className="text-right">R$ {Number(ingredient.unit_cost).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(ingredient)}
                        className="text-primary hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ingredient.id)}
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