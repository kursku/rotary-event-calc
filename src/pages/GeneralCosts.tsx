import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GeneralCost {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export default function GeneralCosts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [costs, setCosts] = useState<GeneralCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (user) {
      loadCosts();
    }
  }, [user]);

  const loadCosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("general_costs")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar custos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCosts(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const { error } = await supabase.from("general_costs").insert([
      {
        user_id: user.id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
      },
    ]);

    if (error) {
      toast({
        title: "Erro ao adicionar custo",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Custo adicionado!",
        description: "O custo foi registrado com sucesso.",
      });
      setIsDialogOpen(false);
      setFormData({
        description: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
      });
      loadCosts();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este custo?")) return;

    const { error } = await supabase.from("general_costs").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir custo",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Custo excluído",
        description: "O custo foi removido com sucesso.",
      });
      loadCosts();
    }
  };

  const totalCosts = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Custos Gerais</h1>
            <p className="text-muted-foreground">Gerencie despesas gerais do clube</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4" />
                Novo Custo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Custo Geral</DialogTitle>
                <DialogDescription>
                  Registre um novo custo geral do clube.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Aluguel de salão"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Infraestrutura, Administrativa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-gradient-primary hover:opacity-90">
                    Adicionar Custo
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
        </div>

        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              R$ {totalCosts.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Total de custos gerais registrados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando custos...</p>
            ) : costs.length === 0 ? (
              <div className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Nenhum custo registrado
                </p>
                <p className="text-muted-foreground">
                  Adicione o primeiro custo clicando no botão "Novo Custo" acima.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell>
                          {format(new Date(cost.date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{cost.description}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-muted rounded-md text-xs">
                            {cost.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          R$ {Number(cost.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cost.id)}
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
      </main>
    </div>
  );
}
