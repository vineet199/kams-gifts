import { Link } from "wouter";
import { Package, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                <Package className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-primary">GiftPro</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link href="/catalog" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Catalog</Link>
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Admin</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/quote" className="inline-flex h-10 items-center justify-center rounded-sm bg-secondary px-6 text-sm font-medium text-secondary-foreground shadow transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              Request Quote
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "md:hidden absolute top-20 left-0 w-full bg-background border-b shadow-lg transition-all duration-200 ease-in-out overflow-hidden",
          isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col px-4 py-4 space-y-4">
          <Link 
            href="/" 
            className="text-sm font-medium p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/catalog" 
            className="text-sm font-medium p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Catalog
          </Link>
          <Link 
            href="/admin" 
            className="text-sm font-medium p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Admin
          </Link>
          <Link 
            href="/quote" 
            className="text-sm font-medium p-2 rounded-md bg-secondary text-secondary-foreground text-center"
            onClick={() => setIsOpen(false)}
          >
            Request Quote
          </Link>
        </div>
      </div>
    </nav>
  );
}
