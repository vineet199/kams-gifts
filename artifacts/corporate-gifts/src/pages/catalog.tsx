import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Filter, SlidersHorizontal, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Catalog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [negotiable, setNegotiable] = useState<boolean | undefined>(undefined);

  const { data: products, isLoading } = useListProducts({
    search: search || undefined,
    category: category && category !== "all" ? category : undefined,
    visible: true,
    negotiable: negotiable
  });

  const { data: categories } = useListCategories();

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1"/> In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><AlertCircle className="w-3 h-3 mr-1"/> Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200"><XCircle className="w-3 h-3 mr-1"/> Out of Stock</Badge>;
      default:
        return null;
    }
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground">Categories</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`text-left px-3 py-2 rounded-sm text-sm transition-colors ${!category || category === "all" ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-foreground"}`}
          >
            All Categories
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={`text-left flex items-center justify-between px-3 py-2 rounded-sm text-sm transition-colors ${category === cat.slug ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-foreground"}`}
            >
              <span>{cat.name}</span>
              <span className={`text-xs ${category === cat.slug ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{cat.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground">Pricing Type</h3>
        <Select 
          value={negotiable === undefined ? "all" : negotiable ? "true" : "false"} 
          onValueChange={(val) => setNegotiable(val === "all" ? undefined : val === "true")}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Pricing Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pricing Types</SelectItem>
            <SelectItem value="true">Negotiable Available</SelectItem>
            <SelectItem value="false">Fixed Price Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="bg-primary py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="font-serif text-3xl font-bold text-white md:text-5xl mb-4">The Collection</h1>
          <p className="text-primary-foreground/80 max-w-2xl text-lg">
            Explore our meticulously curated inventory of premium corporate gifts. 
            Filter by category to find the perfect statement for your brand.
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Desktop Sidebar */}
          <aside className="hidden w-64 shrink-0 md:block">
            <div className="sticky top-28">
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search & Mobile Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="sm:hidden w-full flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>Refine your product search</SheetDescription>
                  </SheetHeader>
                  <FilterContent />
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Header */}
            <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground pb-4 border-b">
              <span>Showing {products?.length || 0} products</span>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted aspect-[4/3] rounded-t-lg"></div>
                    <div className="p-4 border border-t-0 rounded-b-lg space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-1/4 mt-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg bg-muted/20 border-dashed">
                <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-serif text-xl font-medium text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground max-w-md">We couldn't find any products matching your current filters. Try adjusting your search criteria.</p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setNegotiable(undefined);
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products?.map((product) => (
                  <Card key={product.id} className="overflow-hidden border-border flex flex-col group hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                          <Package className="h-12 w-12 text-secondary/40" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {getStockBadge(product.stockStatus)}
                        {product.isNegotiable && (
                          <Badge variant="secondary" className="w-max bg-white/90 text-primary hover:bg-white backdrop-blur-sm border shadow-sm font-medium">Negotiable Available</Badge>
                        )}
                      </div>
                    </div>
                    
                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">{product.category}</div>
                      <h3 className="font-serif font-bold text-xl text-primary line-clamp-1 mb-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{product.description}</p>
                      
                      <div className="flex items-end justify-between mt-auto pt-4 border-t border-border/50">
                        <div>
                          {product.discountPrice ? (
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground line-through">${product.basePrice.toFixed(2)}</span>
                              <span className="font-serif font-semibold text-lg text-primary">${product.discountPrice.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="font-serif font-semibold text-lg text-primary">${product.basePrice.toFixed(2)}</span>
                          )}
                          <div className="text-xs text-muted-foreground mt-0.5">Base Price</div>
                        </div>
                        <Link href={`/quote?product=${product.id}`}>
                          <Button size="sm" variant="outline" className="h-8 border-primary text-primary hover:bg-primary hover:text-white">
                            Inquire
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
