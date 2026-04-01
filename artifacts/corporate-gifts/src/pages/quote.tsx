import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Phone, MapPin } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Quote() {

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-primary py-12 md:py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2040&auto=format&fit=crop')] bg-cover bg-center"></div>
          <div className="container relative z-10 mx-auto px-4">
            <h1 className="font-serif text-4xl font-bold text-white mb-4">Contact for Quotation</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
              For inquiries and quotation requests, please contact us directly using the details below.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          <div className="bg-card border rounded-xl shadow-sm p-6 md:p-8 space-y-8">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold text-primary">Reach Us Directly</h2>
              <p className="mt-3 text-muted-foreground">
                Please contact us directly for pricing, bulk orders, and customization requests.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border p-5 bg-muted/30">
                <p className="text-sm font-semibold text-primary mb-3">Phone</p>
                <a href="tel:+919847177209" className="inline-flex items-center gap-3 text-lg font-bold text-primary hover:text-secondary transition-colors">
                  <Phone className="h-5 w-5" />
                  +91 9847177209
                </a>
              </div>

              <div className="rounded-lg border p-5 bg-muted/30">
                <p className="text-sm font-semibold text-primary mb-3">Address</p>
                <p className="inline-flex items-start gap-3 text-primary">
                  <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
                  <span>66/349/7, Mahakavi Bharathiyar Road, Ernakulam, Kochi - 682035</span>
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Link href="/catalog">
                <Button size="lg">Browse Catalog</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
