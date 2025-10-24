import { useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  unit_of_measure: string;
  unit_cost: number;
}

interface IngredientRow {
  ingredientId: string;
  quantity: string;
}

interface RecipeIngredient {
  id?: string;
  ingredient_id: string;
  name: string;
  unit_of_measure: string;
  unit_cost: number;
  quantity_used: number;
}

interface QuickIngredientInputProps {
  availableIngredients: Ingredient[];
  recipeIngredients: RecipeIngredient[];
  onIngredientsChange: (ingredients: RecipeIngredient[]) => void;
  yieldQuantity: number;
}

export default function QuickIngredientInput({
  availableIngredients,
  recipeIngredients,
  onIngredientsChange,
  yieldQuantity,
}: QuickIngredientInputProps) {
  const quantityInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const handleIngredientSelect = (index: number, ingredientId: string) => {
    const ingredient = availableIngredients.find(ing => ing.id === ingredientId);
    if (!ingredient) return;

    const existingIndex = recipeIngredients.findIndex(ri => ri.ingredient_id === ingredientId);
    
    if (existingIndex > -1) {
      // Ingrediente já existe, apenas foca no próximo input
      setTimeout(() => {
        const nextIndex = Math.min(index + 1, recipeIngredients.length);
        quantityInputRefs.current[nextIndex]?.focus();
      }, 100);
      return;
    }

    // Adiciona novo ingrediente com quantidade 0
    const newRecipeIngredients = [
      ...recipeIngredients,
      {
        ingredient_id: ingredient.id,
        name: ingredient.name,
        unit_of_measure: ingredient.unit_of_measure,
        unit_cost: ingredient.unit_cost,
        quantity_used: 0,
      },
    ];
    onIngredientsChange(newRecipeIngredients);

    // Foca no input de quantidade após adicionar
    setTimeout(() => {
      quantityInputRefs.current[recipeIngredients.length]?.focus();
    }, 100);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const quantity = parseFloat(value) || 0;
    const updatedIngredients = [...recipeIngredients];
    updatedIngredients[index].quantity_used = quantity;
    onIngredientsChange(updatedIngredients);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Focar no próximo input de quantidade ou no select se for o último
      const nextIndex = index + 1;
      if (nextIndex < recipeIngredients.length) {
        quantityInputRefs.current[nextIndex]?.focus();
      }
    }
  };

  const handleRemove = (ingredientId: string) => {
    const updated = recipeIngredients.filter(item => item.ingredient_id !== ingredientId);
    onIngredientsChange(updated);
  };

  // Filtrar ingredientes já adicionados
  const usedIngredientIds = new Set(recipeIngredients.map(ri => ri.ingredient_id));
  const availableForSelection = availableIngredients.filter(
    ing => !usedIngredientIds.has(ing.id)
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrediente</TableHead>
              <TableHead>Qtd Total</TableHead>
              <TableHead>Qtd/Unid</TableHead>
              <TableHead className="text-right">Custo Unit.</TableHead>
              <TableHead className="text-right">Custo Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipeIngredients.map((item, index) => {
              const unitQuantity = yieldQuantity > 0 ? item.quantity_used / yieldQuantity : 0;
              const totalCost = item.quantity_used * item.unit_cost;
              
              return (
                <TableRow key={item.ingredient_id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Input
                      ref={(el) => (quantityInputRefs.current[index] = el)}
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity_used || ''}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-24"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {unitQuantity.toFixed(3)} {item.unit_of_measure}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {item.unit_cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {totalCost.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.ingredient_id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {/* Linha para adicionar novo ingrediente */}
            {availableForSelection.length > 0 && (
              <TableRow>
                <TableCell>
                  <Select
                    value=""
                    onValueChange={(value) => handleIngredientSelect(recipeIngredients.length, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione para adicionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableForSelection.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} ({ingredient.unit_of_measure})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell colSpan={5} className="text-muted-foreground text-sm">
                  Selecione um ingrediente para adicionar
                </TableCell>
              </TableRow>
            )}

            {availableForSelection.length === 0 && recipeIngredients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum ingrediente disponível. Cadastre ingredientes primeiro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {recipeIngredients.length === 0 && availableForSelection.length > 0 && (
        <p className="text-sm text-muted-foreground">
          💡 Dica: Selecione um ingrediente acima e pressione Tab ou Enter para ir para o próximo campo
        </p>
      )}
    </div>
  );
}
