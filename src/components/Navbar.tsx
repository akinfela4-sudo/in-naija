"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Menu, 
  X, 
  TrendingUp, 
  Map, 
  BarChart3,
  Globe
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { name: "Home", href: "/" },
  { name: "Politics & Power", href: "/category/politics" },
  { name: "Naija Pulse (Trending)", href: "/category/trending" },
  { name: "Business & Economy", href: "/category/business" },
  { name: "Tech & Innovation", href: "/category/tech" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "pidgin">("en");
  const router = useRouter();

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
    const savedLang = match ? match[1] : "en";
    if (savedLang === "pidgin" || savedLang === "en") {
      setLang(savedLang);
    }
  }, []);

  const handleLanguageChange = (newLang: "en" | "pidgin") => {
    document.cookie = `lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    setLang(newLang);
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                IN-NAIJA
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {categories.map((cat) => (
              <Link 
                key={cat.name} 
                href={cat.href}
                className="transition-colors hover:text-green-600"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Search and Language Toggle */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search news..."
                className="w-64 pl-9 bg-muted/50 focus-visible:ring-green-600"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2 text-sm">
                <Globe className="h-4 w-4" />
                <span>{lang === "en" ? "English" : "Pidgin"}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleLanguageChange("en")}>English (Standard)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange("pidgin")}>In-Naija Pidgin</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="bg-green-700 hover:bg-green-800">
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search news..."
              className="w-full pl-9"
            />
          </div>
          <div className="flex flex-col space-y-3">
            {categories.map((cat) => (
              <Link 
                key={cat.name} 
                href={cat.href}
                className="text-lg font-medium py-2 border-b border-muted"
                onClick={() => setIsMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4">
             <Button 
               variant={lang === "pidgin" ? "default" : "outline"} 
               className={`w-[48%] ${lang === "pidgin" ? "bg-green-700 hover:bg-green-800 text-white" : ""}`}
               onClick={() => handleLanguageChange(lang === "en" ? "pidgin" : "en")}
             >
               {lang === "pidgin" ? "English Mode" : "Pidgin Mode"}
             </Button>
             <Button className="w-[48%] bg-green-700">Sign In</Button>
          </div>
        </div>
      )}
    </nav>
  );
}
