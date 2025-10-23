import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils } from "lucide-react";

export default function Kitchen() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cozinha & Receitas</h1>
          <p className="text-muted-foreground">Gerencie ingredientes, receitas e itens de menu</p>
        </div>

        <Card className="shadow-md">
          <CardContent className="py-12 text-center">
            <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground mb-2">
              Módulo de Cozinha em Desenvolvimento
            </p>
            <p className="text-muted-foreground">
              Esta página será o centro para gerenciar seus ingredientes, criar receitas e definir itens de menu para seus eventos.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}