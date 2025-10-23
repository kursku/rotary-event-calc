import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IngredientsTab from "./kitchen/IngredientsTab"; // Import the new IngredientsTab
// import RecipesTab from "./kitchen/RecipesTab"; // Will be created later
// import MenuItemsTab from "./kitchen/MenuItemsTab"; // Will be created later

export default function Kitchen() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cozinha & Receitas</h1>
          <p className="text-muted-foreground">Gerencie ingredientes, receitas e itens de menu</p>
        </div>

        <Tabs defaultValue="ingredients" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-fit">
            <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
            <TabsTrigger value="recipes">Receitas</TabsTrigger>
            <TabsTrigger value="menu-items">Cardápio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ingredients" className="mt-6">
            <IngredientsTab />
          </TabsContent>
          
          <TabsContent value="recipes" className="mt-6">
            {/* <RecipesTab /> */}
            <div className="py-12 text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                Módulo de Receitas em Desenvolvimento
              </p>
              <p className="text-muted-foreground">
                Esta seção permitirá criar e gerenciar suas receitas.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="menu-items" className="mt-6">
            {/* <MenuItemsTab /> */}
            <div className="py-12 text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                Módulo de Cardápio em Desenvolvimento
              </p>
              <p className="text-muted-foreground">
                Esta seção permitirá definir os itens finais para venda.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}