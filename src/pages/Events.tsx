import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, Calculator, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  status: string;
  total_cost: number;
  total_revenue: number;
  created_at: string;
}

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    status: "planning",
  });

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar eventos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const { error } = await supabase.from("events").insert([
      {
        user_id: user.id,
        ...formData,
      },
    ]);

    if (error) {
      toast({
        title: "Erro ao criar evento",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Evento criado!",
        description: "O evento foi criado com sucesso.",
      });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        event_date: "",
        status: "planning",
      });
      loadEvents();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir evento",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Evento excluído",
        description: "O evento foi removido com sucesso.",
      });
      loadEvents();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      planning: "bg-muted text-muted-foreground",
      confirmed: "bg-primary/10 text-primary",
      completed: "bg-success/10 text-success",
      cancelled: "bg-destructive/10 text-destructive",
    };

    const labels = {
      planning: "Planejamento",
      confirmed: "Confirmado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };

    return (
      <span className={`text-xs px-3 py-1 rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Eventos</h1>
            <p className="text-muted-foreground">Gerencie os eventos do Rotary Club</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
                <DialogDescription>
                  Preencha os dados básicos do evento. Você poderá adicionar itens e custos depois.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Evento</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Geek Festival 2025"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalhes sobre o evento..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_date">Data do Evento</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planejamento</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-gradient-primary hover:opacity-90">
                    Criar Evento
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

        {loading ? (
          <p className="text-center text-muted-foreground">Carregando eventos...</p>
        ) : events.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground mb-2">
                Nenhum evento cadastrado
              </p>
              <p className="text-muted-foreground">
                Crie seu primeiro evento clicando no botão "Novo Evento" acima.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="shadow-md hover:shadow-lg transition-smooth">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    {getStatusBadge(event.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.event_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </p>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {event.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Receita:</span>
                      <span className="font-semibold text-success">
                        R$ {Number(event.total_revenue).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Custos:</span>
                      <span className="font-semibold text-destructive">
                        R$ {Number(event.total_cost).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-medium">Resultado:</span>
                      <span
                        className={`font-bold ${
                          Number(event.total_revenue) - Number(event.total_cost) >= 0
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        R${" "}
                        {(Number(event.total_revenue) - Number(event.total_cost)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/events/${event.id}/calculator`} className="flex-1">
                      <Button className="w-full gap-2" size="sm">
                        <Calculator className="h-4 w-4" />
                        Calculadora
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}