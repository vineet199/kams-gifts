import { Link } from "wouter";
import { Package, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16 md:px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-secondary text-secondary-foreground">
                <Package className="h-5 w-5" />
              </div>
              <span className="font-sans text-2xl font-bold tracking-tight text-white">Kams Marketing</span>
            </Link>
            <p className="text-sm text-primary-foreground/70 max-w-xs leading-relaxed">
              Elevating corporate relationships through exceptionally crafted, thoughtfully curated gifts and accessories.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 font-serif text-lg font-semibold text-white">Navigation</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link href="/" className="hover:text-secondary transition-colors">Home</Link></li>
              <li><Link href="/catalog" className="hover:text-secondary transition-colors">Full Catalog</Link></li>
              <li><Link href="/quote" className="hover:text-secondary transition-colors">Request a Quote</Link></li>
              <li><Link href="/admin" className="hover:text-secondary transition-colors">Admin Portal</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-serif text-lg font-semibold text-white">Categories</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link href="/catalog?category=bags" className="hover:text-secondary transition-colors">Premium Bags</Link></li>
              <li><Link href="/catalog?category=stationery" className="hover:text-secondary transition-colors">Stationery</Link></li>
              <li><Link href="/catalog?category=tech" className="hover:text-secondary transition-colors">Tech Accessories</Link></li>
              <li><Link href="/catalog?category=drinkware" className="hover:text-secondary transition-colors">Drinkware</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-serif text-lg font-semibold text-white">Contact Us</h3>
            <ul className="space-y-4 text-sm text-primary-foreground/70">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-secondary shrink-0" />
                <span>66/349/7, Mahakavi Bharathiyar Road,<br/>Ernakulam, Kochi - 682035</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-secondary shrink-0" />
                <span>+91 9847177209</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-secondary shrink-0" />
                <span>concierge@giftpro.example.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 border-t border-primary-foreground/10 pt-8 text-center text-sm text-primary-foreground/50">
          <p>&copy; {new Date().getFullYear()} Kams Marketing Corporate Gifting. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
