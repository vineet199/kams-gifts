import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateQuotation, useListProducts } from "@/lib/supabase-data";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

const quoteFormSchema = z.object({
  customerName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  customerEmail: z.string().email({ message: "Please enter a valid email address." }),
  customerPhone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10, { message: "Please provide some details about your inquiry." }),
  quantity: z.string().optional(),
});

export default function Quote() {
  const { toast } = useToast();
  const createQuotation = useCreateQuotation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [location] = useLocation();
  
  // Extract product ID from URL if present
  const searchParams = new URLSearchParams(window.location.search);
  const prefillProductId = searchParams.get("product");
  const prefillProductIds = prefillProductId ? [parseInt(prefillProductId)] : [];

  const { data: products } = useListProducts({ visible: true });
  const productList = Array.isArray(products) ? products : [];
  const prefillProduct = productList.find(p => p.id === parseInt(prefillProductId || "0"));

  const form = useForm<z.infer<typeof quoteFormSchema>>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      company: "",
      message: prefillProduct ? `I am interested in inquiring about: ${prefillProduct.name}.` : "",
      quantity: "",
    },
  });

  function onSubmit(values: z.infer<typeof quoteFormSchema>) {
    createQuotation.mutate({
      data: {
        ...values,
        productIds: prefillProductIds,
      }
    }, {
      onSuccess: () => {
        setIsSubmitted(true);
        window.scrollTo(0, 0);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: "There was an error submitting your request. Please try again.",
        });
      }
    });
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full text-center space-y-6 p-8 bg-card border rounded-lg shadow-sm">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <h2 className="font-serif text-3xl font-bold text-primary">Inquiry Received</h2>
            <p className="text-muted-foreground">
              Thank you for your interest in GiftPro. One of our corporate gifting specialists will review your request and respond within 24 business hours.
            </p>
            <div className="pt-6 border-t border-border flex flex-col gap-3">
              <Link href="/catalog">
                <Button className="w-full">Continue Browsing</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">Return Home</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-primary py-12 md:py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2040&auto=format&fit=crop')] bg-cover bg-center"></div>
          <div className="container relative z-10 mx-auto px-4">
            <h1 className="font-serif text-4xl font-bold text-white mb-4">Request a Quotation</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
              Let us help you curate the perfect corporate gifting experience. 
              Provide your details below and our specialists will craft a customized proposal.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          {prefillProduct && (
            <div className="mb-8 p-4 bg-muted rounded-lg flex items-center gap-4 border">
              {prefillProduct.imageUrl && (
                <img src={prefillProduct.imageUrl} alt={prefillProduct.name} className="w-16 h-16 object-cover rounded-md" />
              )}
              <div>
                <h3 className="font-medium text-primary text-sm uppercase tracking-wider mb-1">Inquiring About</h3>
                <p className="font-serif text-xl font-bold text-primary">{prefillProduct.name}</p>
              </div>
              <Link href="/catalog" className="ml-auto flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-1" /> Change
              </Link>
            </div>
          )}

          <div className="bg-card border rounded-xl shadow-sm p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Email <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="jane@company.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Quantity Required</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 50-100 units" {...field} />
                      </FormControl>
                      <FormDescription>Volume discounts apply to orders over 25 units.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inquiry Details <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your gifting needs, timeline, and any specific customization requirements..." 
                          className="min-h-[150px] resize-y" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t border-border">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full md:w-auto"
                    disabled={createQuotation.isPending}
                  >
                    {createQuotation.isPending ? "Submitting Request..." : "Submit Inquiry Request"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    By submitting this form, you agree to our terms of service and privacy policy. We will never share your information with third parties.
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
