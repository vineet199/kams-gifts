import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

export type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  imageUrl: string | null;
  basePrice: number;
  discountPrice: number | null;
  minNegotiationPrice: number | null;
  isNegotiable: boolean;
  isVisible: boolean;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  notes: string | null;
  bulkPricingNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Quotation = {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  company: string | null;
  productIds: number[];
  message: string;
  quantity: string | null;
  status: "pending" | "reviewed" | "responded" | "closed";
  createdAt: Date;
};

export type CategoryWithCount = {
  slug: string;
  name: string;
  productCount: number;
};

export type ProductStats = {
  total: number;
  visible: number;
  hidden: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  negotiable: number;
  totalCategories: number;
};

type NewProductInput = Omit<
  Product,
  "id" | "createdAt" | "updatedAt" | "notes" | "bulkPricingNotes" | "imageUrl" | "discountPrice" | "minNegotiationPrice"
> & {
  imageUrl?: string | null;
  discountPrice?: number | null;
  minNegotiationPrice?: number | null;
  notes?: string | null;
  bulkPricingNotes?: string | null;
};

export const queryKeys = {
  products: ["supabase", "products"] as const,
  categories: ["supabase", "categories"] as const,
  stats: ["supabase", "stats"] as const,
  quotations: ["supabase", "quotations"] as const,
};

export const getListProductsQueryKey = () => queryKeys.products;
export const getGetProductStatsQueryKey = () => queryKeys.stats;
export const getListQuotationsQueryKey = () => queryKeys.quotations;

const mapProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  categorySlug: row.category_slug,
  imageUrl: row.image_url,
  basePrice: row.base_price,
  discountPrice: row.discount_price,
  minNegotiationPrice: row.min_negotiation_price,
  isNegotiable: row.is_negotiable,
  isVisible: row.is_visible,
  stockStatus: row.stock_status,
  notes: row.notes,
  bulkPricingNotes: row.bulk_pricing_notes,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

const mapQuotation = (row: any): Quotation => ({
  id: row.id,
  customerName: row.customer_name,
  customerEmail: row.customer_email,
  customerPhone: row.customer_phone,
  company: row.company,
  productIds: row.product_ids ?? [],
  message: row.message,
  quantity: row.quantity,
  status: row.status,
  createdAt: new Date(row.created_at),
});

export function useListProducts(filters?: {
  search?: string;
  category?: string;
  visible?: boolean;
  negotiable?: boolean;
}) {
  return useQuery({
    queryKey: [...queryKeys.products, filters ?? {}],
    queryFn: async () => {
      const sb = getSupabaseClient();
      let query = sb.from("products").select("*");
      if (filters?.category) query = query.eq("category_slug", filters.category);
      if (filters?.visible !== undefined) query = query.eq("is_visible", filters.visible);
      if (filters?.negotiable !== undefined) query = query.eq("is_negotiable", filters.negotiable);
      if (filters?.search) {
        const s = filters.search.trim();
        if (s) query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
      }
      const { data, error } = await query.order("category_slug", { ascending: true }).order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapProduct);
    },
  });
}

export function useListCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const sb = getSupabaseClient();
      const { data, error } = await sb.from("products").select("category_slug, category");
      if (error) throw error;
      const map = new Map<string, CategoryWithCount>();
      for (const row of data ?? []) {
        const key = row.category_slug;
        const item = map.get(key);
        if (item) item.productCount += 1;
        else map.set(key, { slug: key, name: row.category, productCount: 1 });
      }
      return Array.from(map.values());
    },
  });
}

export function useGetProductStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => {
      const sb = getSupabaseClient();
      const { data, error } = await sb
        .from("products")
        .select("is_visible, stock_status, is_negotiable, category_slug");
      if (error) throw error;
      const rows = data ?? [];
      return {
        total: rows.length,
        visible: rows.filter((r) => r.is_visible).length,
        hidden: rows.filter((r) => !r.is_visible).length,
        inStock: rows.filter((r) => r.stock_status === "in_stock").length,
        lowStock: rows.filter((r) => r.stock_status === "low_stock").length,
        outOfStock: rows.filter((r) => r.stock_status === "out_of_stock").length,
        negotiable: rows.filter((r) => r.is_negotiable).length,
        totalCategories: new Set(rows.map((r) => r.category_slug)).size,
      } as ProductStats;
    },
  });
}

export function useListQuotations() {
  return useQuery({
    queryKey: queryKeys.quotations,
    queryFn: async () => {
      const sb = getSupabaseClient();
      const { data, error } = await sb
        .from("quotations")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapQuotation);
    },
  });
}

export function useCreateQuotation() {
  return useMutation({
    mutationFn: async (input: {
      data: {
        customerName: string;
        customerEmail: string;
        customerPhone?: string;
        company?: string;
        productIds: number[];
        message: string;
        quantity?: string;
      };
    }) => {
      const sb = getSupabaseClient();
      const payload = input.data;
      const { data, error } = await sb
        .from("quotations")
        .insert({
          customer_name: payload.customerName,
          customer_email: payload.customerEmail,
          customer_phone: payload.customerPhone ?? null,
          company: payload.company ?? null,
          product_ids: payload.productIds,
          message: payload.message,
          quantity: payload.quantity ?? null,
          status: "pending",
        })
        .select("*")
        .single();
      if (error) throw error;
      return mapQuotation(data);
    },
  });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: async (
      input: {
        data: NewProductInput;
      },
    ) => {
      const sb = getSupabaseClient();
      const payload = input.data;
      const { data, error } = await sb
        .from("products")
        .insert({
          name: payload.name,
          description: payload.description,
          category: payload.category,
          category_slug: payload.categorySlug,
          image_url: payload.imageUrl,
          base_price: payload.basePrice,
          discount_price: payload.discountPrice,
          min_negotiation_price: payload.minNegotiationPrice,
          is_negotiable: payload.isNegotiable,
          is_visible: payload.isVisible,
          stock_status: payload.stockStatus,
          notes: payload.notes,
          bulk_pricing_notes: payload.bulkPricingNotes,
        })
        .select("*")
        .single();
      if (error) throw error;
      return mapProduct(data);
    },
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: async ({ id, data: payload }: { id: number; data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">> }) => {
      const sb = getSupabaseClient();
      const patch: Record<string, unknown> = {};
      if (payload.name !== undefined) patch.name = payload.name;
      if (payload.description !== undefined) patch.description = payload.description;
      if (payload.category !== undefined) patch.category = payload.category;
      if (payload.categorySlug !== undefined) patch.category_slug = payload.categorySlug;
      if (payload.imageUrl !== undefined) patch.image_url = payload.imageUrl;
      if (payload.basePrice !== undefined) patch.base_price = payload.basePrice;
      if (payload.discountPrice !== undefined) patch.discount_price = payload.discountPrice;
      if (payload.minNegotiationPrice !== undefined) patch.min_negotiation_price = payload.minNegotiationPrice;
      if (payload.isNegotiable !== undefined) patch.is_negotiable = payload.isNegotiable;
      if (payload.isVisible !== undefined) patch.is_visible = payload.isVisible;
      if (payload.stockStatus !== undefined) patch.stock_status = payload.stockStatus;
      if (payload.notes !== undefined) patch.notes = payload.notes;
      if (payload.bulkPricingNotes !== undefined) patch.bulk_pricing_notes = payload.bulkPricingNotes;

      const { data, error } = await sb
        .from("products")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return mapProduct(data);
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async (input: { id: number }) => {
      const sb = getSupabaseClient();
      const { error } = await sb.from("products").delete().eq("id", input.id);
      if (error) throw error;
      return input.id;
    },
  });
}

export function useUpdateQuotation() {
  return useMutation({
    mutationFn: async ({ id, data: payload }: { id: number; data: { status?: Quotation["status"] } }) => {
      const sb = getSupabaseClient();
      const { data, error } = await sb
        .from("quotations")
        .update({ status: payload.status })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return mapQuotation(data);
    },
  });
}

export async function uploadProductImage(file: File): Promise<string> {
  const sb = getSupabaseClient();
  const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "product-images";
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `products/${unique}.${ext}`;

  const { error } = await sb.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = sb.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}
