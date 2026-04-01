import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Building2, Briefcase, FileText, CheckCircle2, Package } from "lucide-react";
import { Link } from "wouter";
import { useGetProductStats, useListCategories, useListProducts } from "@/lib/supabase-data";
import { motion } from "framer-motion";

export default function Home() {
  const { data: stats } = useGetProductStats();
  const { data: categories } = useListCategories();
  const { data: featuredProducts } = useListProducts({ visible: true });

  const products = Array.isArray(featuredProducts) ? featuredProducts : [];
  const displayProducts = products.slice(0, 4);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-primary py-24 md:py-32 lg:py-40">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          </div>
          
          <div className="container relative mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-center space-y-8"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary">
                    <span className="flex h-2 w-2 rounded-full bg-secondary mr-2"></span>
                    Premium B2B Gifting
                  </div>
                  <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl xl:text-6xl/none">
                    Exceptional Gifts for <br/>Exceptional Clients
                  </h1>
                  <p className="max-w-[600px] text-lg text-primary-foreground/80 md:text-xl leading-relaxed">
                    Discover our curated collection of luxury bags, elegant stationery, and sophisticated accessories designed to strengthen your corporate relationships.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 min-[400px]:flex-row">
                  <Link href="/catalog" className="inline-flex h-12 items-center justify-center rounded-sm bg-secondary px-8 text-base font-medium text-secondary-foreground shadow transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    Explore Catalog
                  </Link>
                  <Link href="/quote" className="inline-flex h-12 items-center justify-center rounded-sm border border-primary-foreground/20 bg-transparent px-8 text-base font-medium text-white shadow-sm transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    Request Inquiry
                  </Link>
                </div>
                
                <div className="flex items-center gap-8 pt-4 border-t border-primary-foreground/10">
                  <div className="flex flex-col">
                    <span className="font-serif text-3xl font-bold text-white">{stats?.total || '500'}+</span>
                    <span className="text-sm text-primary-foreground/60">Premium Products</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-3xl font-bold text-white">{stats?.totalCategories || '12'}</span>
                    <span className="text-sm text-primary-foreground/60">Curated Categories</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-3xl font-bold text-white">15+</span>
                    <span className="text-sm text-primary-foreground/60">Years Experience</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mx-auto w-full max-w-[500px] lg:max-w-none relative"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted shadow-2xl relative">
                  <img
                    alt="Luxury corporate gifting showroom"
                    className="object-cover w-full h-full"
                    src="/hero.png"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2040&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-white font-serif text-xl font-medium">The Signature Collection</p>
                    <p className="text-white/80 text-sm mt-1">Curated for excellence</p>
                  </div>
                </div>
                
                {/* Decorative element */}
                <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-secondary/20 rounded-full blur-3xl -z-10"></div>
                <div className="absolute -top-6 -right-6 w-48 h-48 bg-primary-foreground/10 rounded-full blur-3xl -z-10"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div className="max-w-[600px]">
                <h2 className="font-serif text-3xl font-bold tracking-tight text-primary sm:text-4xl">Curated Collections</h2>
                <p className="mt-4 text-muted-foreground text-lg">Browse our thoughtfully organized selection of premium items designed to make a lasting impression.</p>
              </div>
              <Link href="/catalog" className="group flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
                View all categories <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "laptop bags", slug: "laptop-bags", icon: Briefcase, desc: "Office-ready laptop bags", img: "/bag.png" },
                { name: "Bagpacks", slug: "bagpacks", icon: FileText, desc: "Everyday and travel backpacks", img: "/stationery.png" },
                { name: "Travle Bags", slug: "travle-bags", icon: Building2, desc: "Corporate travel essentials", img: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=2070&auto=format&fit=crop" },
                { name: "Flasks Mug/glass", slug: "flasks-mug-glass", icon: CheckCircle2, desc: "Drinkware gifting options", img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2070&auto=format&fit=crop" },
              ].map((cat, i) => (
                <Link key={i} href={`/catalog?category=${cat.slug}`} className="group relative overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 block h-[300px]">
                  <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent transition-opacity group-hover:opacity-90"></div>
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="bg-white/10 backdrop-blur-md p-3 w-max rounded-sm mb-4 text-white">
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white mb-1">{cat.name}</h3>
                    <p className="text-white/80 text-sm">{cat.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-20 bg-muted/50 border-y">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-[800px] mx-auto mb-16">
              <h2 className="font-serif text-3xl font-bold tracking-tight text-primary sm:text-4xl">Featured Additions</h2>
              <p className="mt-4 text-muted-foreground text-lg">Our newest arrivals and most requested corporate gifts, hand-selected for quality and presentation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden border-border hover:shadow-lg transition-all group">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                        <Package className="h-12 w-12 text-secondary/40" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <span className="bg-background/90 backdrop-blur-sm text-primary text-xs px-2 py-1 rounded-sm font-medium border shadow-sm">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg text-primary line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                      <p className="text-xs text-muted-foreground italic">Price on request</p>
                      <Link href="/quote" className="text-sm font-medium text-secondary hover:text-secondary/80 transition-colors">
                        Inquire
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <Link href="/catalog" className="inline-flex h-11 items-center justify-center rounded-sm bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                View Entire Collection
              </Link>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-[800px] mx-auto mb-16">
              <h2 className="font-serif text-3xl font-bold tracking-tight text-primary sm:text-4xl">The GiftPro Experience</h2>
              <p className="mt-4 text-muted-foreground text-lg">A seamless process from selection to delivery, ensuring your corporate gifts make the perfect impression.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-border -z-10"></div>
              
              {[
                { step: "01", title: "Select & Inquire", desc: "Browse our curated catalog and submit an inquiry for your preferred items and quantities." },
                { step: "02", title: "Custom Quotation", desc: "Our concierge team reviews your needs and provides a tailored quote with bulk pricing options." },
                { step: "03", title: "Fulfillment", desc: "Once approved, we handle the logistics, ensuring pristine packaging and timely delivery." }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center bg-background">
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center border-8 border-background shadow-sm mb-6">
                    <span className="font-serif text-2xl font-bold text-secondary">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
