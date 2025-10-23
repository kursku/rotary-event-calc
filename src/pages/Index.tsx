import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  event_date: string;
  total_cost: number;
  total_revenue: number;
  status: string;
}

interface GeneralCost {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export default function Index() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [generalCosts, setGeneralCosts] = useState<GeneralCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);

    const [eventsResult, costsResult] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false })
        .limit(5),
      supabase
        .from("general_costs")
        .select("*")
        .order("date", { ascending: false })
        .limit(5),
    ]);

    if (eventsResult.data) setEvents(eventsResult.data);
    if (costsResult.data) setGeneralCosts(costsResult.data);

    setLoading(false);
  };

  const totalEventRevenue = events.reduce((sum, e) => sum + (Number(e.total_revenue) || 0), 0);
  const totalEventCosts = events.reduce((sum, e) => sum + (Number(e.total_cost) || 0), 0);
  const totalGeneralCosts = generalCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const netProfit = totalEventRevenue - totalEventCosts - totalGeneralCosts;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral financeira do Rotary Club</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita de Eventos
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {totalEventRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Custos de Eventos
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {totalEventCosts.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Custos Gerais
              </CardTitle>
              <DollarSign className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {totalGeneralCosts.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-2 border-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resultado Líquido
              </CardTitle>
              {netProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {netProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Eventos Recentes
              </CardTitle>
              <CardDescription>Últimos 5 eventos cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : events.length === 0 ? (
                <p className="text-muted-foreground">Nenhum evento cadastrado ainda.</p>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.event_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block
                          ${event.status === 'completed' ? 'bg-success/10 text-success' : 
                            event.status === 'confirmed' ? 'bg-primary/10 text-primary' : 
                            'bg-muted text-muted-foreground'}`}>
                          {event.status === 'planning' ? 'Planejamento' :
                           event.status === 'confirmed' ? 'Confirmado' :
                           event.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-success font-semibold">
                          +R$ {Number(event.total_revenue).toFixed(2)}
                        </p>
                        <p className="text-sm text-destructive">
                          -R$ {Number(event.total_cost).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Custos Gerais Recentes
              </CardTitle>
              <CardDescription>Últimos 5 custos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : generalCosts.length === 0 ? (
                <p className="text-muted-foreground">Nenhum custo registrado ainda.</p>
              ) : (
                <div className="space-y-4">
                  {generalCosts.map((cost) => (
                    <div key={cost.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{cost.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(cost.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-destructive">
                        -R$ {Number(cost.amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
