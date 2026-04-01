import { Router, type IRouter } from "express";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  CreateProductBody,
  GetProductParams,
  GetProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
  ListCategoriesResponse,
  GetProductStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category, search, visible, negotiable } = query.data;

  const conditions = [];

  if (category) {
    conditions.push(eq(productsTable.categorySlug, category));
  }

  if (search) {
    conditions.push(
      or(
        ilike(productsTable.name, `%${search}%`),
        ilike(productsTable.description, `%${search}%`)
      )!
    );
  }

  if (visible !== undefined) {
    conditions.push(eq(productsTable.isVisible, visible));
  }

  if (negotiable !== undefined) {
    conditions.push(eq(productsTable.isNegotiable, negotiable));
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(productsTable.categorySlug, productsTable.name);

  res.json(ListProductsResponse.parse(products));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.insert(productsTable).values(parsed.data).returning();
  res.status(201).json(GetProductResponse.parse(product));
});

router.get("/products/stats/summary", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable);

  const stats = {
    total: products.length,
    visible: products.filter((p) => p.isVisible).length,
    hidden: products.filter((p) => !p.isVisible).length,
    inStock: products.filter((p) => p.stockStatus === "in_stock").length,
    lowStock: products.filter((p) => p.stockStatus === "low_stock").length,
    outOfStock: products.filter((p) => p.stockStatus === "out_of_stock").length,
    negotiable: products.filter((p) => p.isNegotiable).length,
    totalCategories: new Set(products.map((p) => p.categorySlug)).size,
  };

  res.json(GetProductStatsResponse.parse(stats));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(product));
});

router.put("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse(product));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/categories", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable);

  const categoryMap = new Map<string, { slug: string; name: string; count: number }>();

  for (const product of products) {
    if (!categoryMap.has(product.categorySlug)) {
      categoryMap.set(product.categorySlug, {
        slug: product.categorySlug,
        name: product.category,
        count: 0,
      });
    }
    categoryMap.get(product.categorySlug)!.count++;
  }

  const categories = Array.from(categoryMap.values()).map((c) => ({
    slug: c.slug,
    name: c.name,
    productCount: c.count,
  }));

  res.json(ListCategoriesResponse.parse(categories));
});

export default router;
