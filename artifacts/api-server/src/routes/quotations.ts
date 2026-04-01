import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, quotationsTable } from "@workspace/db";
import {
  CreateQuotationBody,
  ListQuotationsResponse,
  UpdateQuotationParams,
  UpdateQuotationBody,
  UpdateQuotationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/quotations", async (_req, res): Promise<void> => {
  const quotations = await db
    .select()
    .from(quotationsTable)
    .orderBy(quotationsTable.createdAt);

  res.json(ListQuotationsResponse.parse(quotations));
});

router.post("/quotations", async (req, res): Promise<void> => {
  const parsed = CreateQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [quotation] = await db
    .insert(quotationsTable)
    .values({
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone ?? null,
      company: parsed.data.company ?? null,
      productIds: parsed.data.productIds,
      message: parsed.data.message,
      quantity: parsed.data.quantity ?? null,
      status: "pending",
    })
    .returning();

  res.status(201).json(quotation);
});

router.put("/quotations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateQuotationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [quotation] = await db
    .update(quotationsTable)
    .set(parsed.data)
    .where(eq(quotationsTable.id, params.data.id))
    .returning();

  if (!quotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  res.json(UpdateQuotationResponse.parse(quotation));
});

export default router;
