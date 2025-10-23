import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, Calendar, LogOut, Menu, Utensils } from "lucide-react"; // Added Utensils icon
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Rotary Club</h1>
              <p className="text-xs text-muted-foreground">Piracicaba Engenho</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/events">
              <Button
                variant={isActive("/events") ? "default" : "ghost"}
                className="gap-2"
              >
                <Calculator className="h-4 w-4" />
                Eventos
              </Button>
            </Link>
            <Link to="/costs">
              <Button
                variant={isActive("/costs") ? "default" : "ghost"}
                className="gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Custos Gerais
              </Button>
            </Link>
            <Link to="/kitchen"> {/* New Kitchen Link */}
              <Button
                variant={isActive("/kitchen") ? "default" : "ghost"}
                className="gap-2"
              >
                <Utensils className="h-4 w-4" />
                Cozinha
              </Button>
            </Link>
            <Button
              onClick={() => signOut()}
              variant="ghost"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center gap-2 w-full">
                    <Calendar className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/events" className="flex items-center gap-2 w-full">
                    <Calculator className="h-4 w-4" />
                    Eventos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/costs" className="flex items-center gap-2 w-full">
                    <DollarSign className="h-4 w-4" />
                    Custos Gerais
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild> {/* New Kitchen Link */}
                  <Link to="/kitchen" className="flex items-center gap-2 w-full">
                    <Utensils className="h-4 w-4" />
                    Cozinha
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};