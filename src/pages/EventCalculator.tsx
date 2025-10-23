import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  TableFooter,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, Trash2, TrendingUp, TrendingDown } from "lucide-react";

interface Event {
  id: string;
  title: string;
  event_date: string;
}

interface EventItem {
  id: string;
  name: string;
  category: string;
  unit_cost: number;
  quantity: number;
  unit_price: number;
  total_cost: number;
  total_revenue: number;
}

export default function EventCalculator() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit_cost: "",
    quantity: "1",
    unit_price: "",
  });

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    setLoading(true);
    
    const [eventResult, itemsResult] = await Promise.all([
      supabase.from("events").select("id, title, event_date").eq("id", eventId).single(),
      supabase.from("event_items").select("*").eq("event_id", eventId),
    ]);

    if (eventResult.error) {
      toast({
        title: "Erro ao carregar evento",
        description: eventResult.error.message,
        variant: "destructive",
      });
      navigate("/events");
    } else {
      setEvent(eventResult.data);
    }

    if (itemsResult.data) {
      setItems(itemsResult.data);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("event_items").insert([
      {
        event_id: eventId,
        name: formData.name,
        category: formData.category,
        unit_cost: parseFloat(formData.unit_cost),
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
      },
    ]);

    if (error) {
      toast({
        title: "Erro ao adicionar item",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Item adicionado!",
        description: "O item foi adicionado ao evento.",
      });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        category: "",
        unit_cost: "",
        quantity: "1",
        unit_price: "",
      });
      loadEventData();
      updateEventTotals();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    const { error } = await supabase.from("event_items").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir item",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Item excluído",
        description: "O item foi removido com sucesso.",
      });
      loadEventData();
      updateEventTotals();
    }
  };

  const updateEventTotals = async () => {
    const totalCost = items.reduce((sum, item) => sum + Number(item.total_cost), 0);
    const totalRevenue = items.reduce((sum, item) => sum + Number(item.total_revenue), 0);

    await supabase
      .from("events")
      .update({ total_cost: totalCost, total_revenue: totalRevenue })
      .eq("id", eventId);
  };

  const totalCost = items.reduce((sum, item) => sum + Number(item.total_cost), 0);
  const totalRevenue = items.reduce((sum, item) => sum + Number(item.total_revenue), 0);
  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => navigate("/events")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Eventos
        </Button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{event.title}</h1>
            <p className="text-muted-foreground">Calculadora de Custos e Vendas</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Item ao Evento</DialogTitle>
                <DialogDescription>
                  Preencha os dados do produto ou serviço do evento.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Item</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Cachorro-quente"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Alimentação, Bebidas"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit_cost">Custo Unit. (R$)</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price">Preço Venda Unit. (R$)</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-gradient-primary hover:opacity-90">
                    Adicionar
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">R$ {totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Custo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">R$ {totalCost.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border-2 border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                Lucro Líquido
                {netProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {netProfit.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Margem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${parseFloat(profitMargin) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {profitMargin}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        <Card className="shadow-md">
          <CardContent className="p-0">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg font-medium text-foreground mb-2">
                  Nenhum item adicionado
                </p>
                <p className="text-muted-foreground">
                  Adicione itens ao evento usando o botão "Adicionar Item" acima.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Custo Unit.</TableHead>
                      <TableHead className="text-right">Custo Total</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Receita Total</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const itemProfit = Number(item.total_revenue) - Number(item.total_cost);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-muted rounded-md text-xs">
                              {item.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">R$ {Number(item.unit_cost).toFixed(2)}</TableCell>
                          <TableCell className="text-right text-destructive font-semibold">
                            R$ {Number(item.total_cost).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">R$ {Number(item.unit_price).toFixed(2)}</TableCell>
                          <TableCell className="text-right text-success font-semibold">
                            R$ {Number(item.total_revenue).toFixed(2)}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${itemProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            R$ {itemProfit.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-bold">TOTAIS</TableCell>
                      <TableCell className="text-right font-bold text-destructive">
                        R$ {totalCost.toFixed(2)}
                      </TableCell>
                      <TableCell colSpan={1}></TableCell>
                      <TableCell className="text-right font-bold text-success">
                        R$ {totalRevenue.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        R$ {netProfit.toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
