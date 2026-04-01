import { Navbar } from "@/components/layout/navbar";
import { 
  useGetProductStats, 
  useListProducts, 
  useListQuotations,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateQuotation,
  useListCategories,
  getListProductsQueryKey,
  getGetProductStatsQueryKey,
  getListQuotationsQueryKey,
  uploadProductImage,
} from "@/lib/supabase-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Package, TrendingUp, Users, Eye, EyeOff, Edit, Trash2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_CATEGORIES } from "@/lib/categories";

// Schema for product form
const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  categorySlug: z.string().min(1),
  basePrice: z.coerce.number().min(0),
  discountPrice: z.coerce.number().optional().nullable(),
  minNegotiationPrice: z.coerce.number().optional().nullable(),
  isNegotiable: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock"]),
  imageUrl: z.string().optional().nullable(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function Admin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: stats } = useGetProductStats();
  const { data: products } = useListProducts();
  const { data: quotations } = useListQuotations();
  const { data: categories } = useListCategories();
  const productList = Array.isArray(products) ? products : [];
  const quotationList = Array.isArray(quotations) ? quotations : [];
  const categoryList = Array.isArray(categories) ? categories : [];
  const mergedCategoryList = SUPPORTED_CATEGORIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    productCount: categoryList.find((x) => x.slug === c.slug)?.productCount ?? 0,
  }));
  
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateQuotation = useUpdateQuotation();

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      categorySlug: "",
      basePrice: 0,
      isNegotiable: false,
      isVisible: true,
      stockStatus: "in_stock",
      imageUrl: "",
    },
  });

  // When edit mode changes, reset form
  useEffect(() => {
    if (editingProductId && productList.length) {
      const product = productList.find(p => p.id === editingProductId);
      if (product) {
        form.reset({
          name: product.name,
          description: product.description,
          categorySlug: product.categorySlug,
          basePrice: product.basePrice,
          discountPrice: product.discountPrice,
          minNegotiationPrice: product.minNegotiationPrice,
          isNegotiable: product.isNegotiable,
          isVisible: product.isVisible,
          stockStatus: product.stockStatus as any,
          imageUrl: product.imageUrl,
        });
        setSelectedImageFile(null);
      }
    } else {
      form.reset({
        name: "",
        description: "",
        categorySlug: "",
        basePrice: 0,
        discountPrice: null,
        minNegotiationPrice: null,
        isNegotiable: false,
        isVisible: true,
        stockStatus: "in_stock",
        imageUrl: "",
      });
      setSelectedImageFile(null);
    }
  }, [editingProductId, productList, form]);

  const onProductSubmit = async (values: ProductFormValues) => {
    // Find category name from slug
    const category = mergedCategoryList.find(c => c.slug === values.categorySlug)?.name || values.categorySlug;

    let imageUrl = values.imageUrl ?? null;
    if (selectedImageFile) {
      setIsUploadingImage(true);
      try {
        imageUrl = await uploadProductImage(selectedImageFile);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Image upload failed",
          description: "Could not upload image to Supabase Storage.",
        });
        setIsUploadingImage(false);
        return;
      }
      setIsUploadingImage(false);
    }

    const payload = {
      ...values,
      category,
      imageUrl,
    };

    if (editingProductId) {
      updateProduct.mutate({ id: editingProductId, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
          setIsProductModalOpen(false);
          setEditingProductId(null);
          toast({ title: "Product updated successfully" });
        }
      });
    } else {
      createProduct.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
          setIsProductModalOpen(false);
          toast({ title: "Product created successfully" });
        }
      });
    }
  };

  const handleToggleVisibility = (id: number, currentVisible: boolean) => {
    updateProduct.mutate({ id, data: { isVisible: !currentVisible } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
      }
    });
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
          toast({ title: "Product deleted" });
        }
      });
    }
  };

  const handleUpdateQuoteStatus = (id: number, status: "pending"|"reviewed"|"responded"|"closed") => {
    updateQuotation.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey() });
        toast({ title: "Quotation status updated" });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'responded': return 'bg-emerald-100 text-emerald-800';
      case 'closed': return 'bg-slate-100 text-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-primary">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage inventory, catalog, and customer inquiries.</p>
            </div>
            
            <Dialog open={isProductModalOpen} onOpenChange={(open) => {
              setIsProductModalOpen(open);
              if (!open) setEditingProductId(null);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProductId ? "Edit Product" : "Add New Product"}</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onProductSubmit)} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="categorySlug" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {mergedCategoryList.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField control={form.control} name="basePrice" render={({ field }) => (
                        <FormItem><FormLabel>Base Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="discountPrice" render={({ field }) => (
                        <FormItem><FormLabel>Discount Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="minNegotiationPrice" render={({ field }) => (
                        <FormItem><FormLabel>Min Negotiable ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="stockStatus" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="in_stock">In Stock</SelectItem>
                              <SelectItem value="low_stock">Low Stock</SelectItem>
                              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="imageUrl" render={() => (
                        <FormItem>
                          <FormLabel>Product Image (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setSelectedImageFile(file);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                  </div>
                    <div className="flex gap-8 py-4 px-2 border rounded-md bg-muted/20">
                      <FormField control={form.control} name="isVisible" render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-3 space-y-0">
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <div className="space-y-1 leading-none"><FormLabel>Visible in Catalog</FormLabel></div>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="isNegotiable" render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-3 space-y-0">
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <div className="space-y-1 leading-none"><FormLabel>Negotiable Pricing</FormLabel></div>
                        </FormItem>
                      )} />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending || isUploadingImage}>
                        {isUploadingImage ? "Uploading image..." : "Save Product"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary"><Package className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <h3 className="text-2xl font-bold font-serif text-primary">{stats?.total || 0}</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-full text-emerald-600"><CheckCircle2 className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Catalog</p>
                  <h3 className="text-2xl font-bold font-serif text-primary">{stats?.visible || 0} <span className="text-sm font-normal text-muted-foreground">visible</span></h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-full text-amber-600"><AlertCircle className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inventory Alerts</p>
                  <h3 className="text-2xl font-bold font-serif text-primary">{(stats?.lowStock || 0) + (stats?.outOfStock || 0)} <span className="text-sm font-normal text-muted-foreground">items</span></h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-secondary/20 rounded-full text-secondary"><Users className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Inquiries</p>
                  <h3 className="text-2xl font-bold font-serif text-primary">{quotationList.length}</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="products">Product Catalog</TabsTrigger>
              <TabsTrigger value="quotes">Quotation Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="mt-6">
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productList.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded overflow-hidden bg-muted flex shrink-0 items-center justify-center">
                                {product.imageUrl ? <img src={product.imageUrl} className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                              </div>
                              <div>
                                <p className="font-serif text-primary truncate max-w-[200px]">{product.name}</p>
                                {product.isNegotiable && <span className="text-[10px] uppercase text-secondary font-semibold">Negotiable</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                          <TableCell>
                            <div>${product.basePrice.toFixed(2)}</div>
                            {product.discountPrice && <div className="text-xs text-muted-foreground line-through">${product.discountPrice.toFixed(2)}</div>}
                          </TableCell>
                          <TableCell>
                            {product.stockStatus === 'in_stock' ? <span className="text-emerald-600 text-sm">In Stock</span> : 
                             product.stockStatus === 'low_stock' ? <span className="text-amber-600 text-sm">Low Stock</span> : 
                             <span className="text-rose-600 text-sm">Out of Stock</span>}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={product.isVisible ? "text-primary" : "text-muted-foreground"}
                              onClick={() => handleToggleVisibility(product.id, product.isVisible)}
                            >
                              {product.isVisible ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                              {product.isVisible ? "Visible" : "Hidden"}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditingProductId(product.id);
                              setIsProductModalOpen(true);
                            }}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!productList.length && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                            No products found. Add your first product to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="quotes" className="mt-6">
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotationList.map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell className="whitespace-nowrap">{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <p className="font-medium text-primary">{quote.customerName}</p>
                            {quote.company && <p className="text-xs text-muted-foreground">{quote.company}</p>}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{quote.customerEmail}</p>
                            {quote.customerPhone && <p className="text-xs text-muted-foreground">{quote.customerPhone}</p>}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] text-sm truncate" title={quote.message}>
                              {quote.message}
                            </div>
                            <span className="text-xs font-semibold text-secondary">{quote.productIds.length} item(s)</span>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={quote.status} 
                              onValueChange={(val: any) => handleUpdateQuoteStatus(quote.id, val)}
                            >
                              <SelectTrigger className={`h-8 w-32 border-0 ${getStatusColor(quote.status)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="responded">Responded</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!quotationList.length && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            No quotation requests yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
