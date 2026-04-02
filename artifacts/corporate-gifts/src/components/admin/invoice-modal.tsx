import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { saveInvoiceRecord } from "@/lib/supabase-data";

type InvoiceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ProductRow = {
  id: number;
  serialNumber: string;
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
};

const toNum = (value: string | number) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (n: number) => n.toFixed(2);

const numberToWords = (num: number): string => {
  if (!Number.isFinite(num)) return "Zero Rupees Only";
  const n = Math.round(num);
  if (n === 0) return "Zero Rupees Only";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const twoDigits = (x: number) => {
    if (x < 20) return ones[x];
    return `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ""}`;
  };

  const threeDigits = (x: number) => {
    const h = Math.floor(x / 100);
    const rest = x % 100;
    return `${h ? `${ones[h]} Hundred${rest ? " " : ""}` : ""}${rest ? twoDigits(rest) : ""}`.trim();
  };

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts = [
    crore ? `${threeDigits(crore)} Crore` : "",
    lakh ? `${threeDigits(lakh)} Lakh` : "",
    thousand ? `${threeDigits(thousand)} Thousand` : "",
    hundred ? `${threeDigits(hundred)}` : "",
  ].filter(Boolean);

  return `${parts.join(" ")} Rupees Only`;
};

export function InvoiceModal({ open, onOpenChange }: InvoiceModalProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docType, setDocType] = useState("original");
  const [reverseCharge, setReverseCharge] = useState(false);
  const [gstReverseCharge, setGstReverseCharge] = useState(false);
  const [signatureFile, setSignatureFile] = useState("");
  const [stampFile, setStampFile] = useState("");

  const [invoice, setInvoice] = useState({
    companyName: "KAMS Marketing",
    companyAddress: "66/349/7, Mahakavi Bharathiyar Road, Ernakulam, Kochi - 682035",
    companyPhone: "+91 9847177209",
    companyGstin: "32ASVPS0173M1Z5",
    invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
    invoiceDate: new Date().toISOString().slice(0, 10),
    transportMode: "",
    numberOfCartons: "",
    dateOfSupply: "",
    state: "",
    stateCode: "",
    placeOfSupply: "",

    billToName: "",
    billToAddress: "",
    billToGstin: "",
    billToState: "",
    billToStateCode: "",

    shipToName: "",
    shipToAddress: "",
    shipToGstin: "",
    shipToState: "",
    shipToStateCode: "",

    discountPercent: 0,
    freightPackingCharges: 0,
    cgstPercent: 9,
    sgstPercent: 9,
    igstPercent: 0,

    bankName: "Union Bank of India",
    accountNumber: "407904010020066",
    branch: "Marine Drive, Cochin - 682031",
    ifscCode: "UBIN0540790",

    termsJurisdiction: "All disputes are subject to Kerala jurisdiction",
    termsInterest: "Interest @18% p.a. will be charged on delayed payments",
    termsResponsibility: "Buyer is responsible for checking goods at delivery",
  });

  const [rows, setRows] = useState<ProductRow[]>([
    { id: 1, serialNumber: "1", description: "", hsnCode: "", quantity: 1, rate: 0 },
  ]);

  const rowTotals = useMemo(() => rows.map((r) => toNum(r.quantity) * toNum(r.rate)), [rows]);
  const subtotal = useMemo(() => rowTotals.reduce((sum, t) => sum + t, 0), [rowTotals]);
  const discountAmount = useMemo(() => subtotal * (toNum(invoice.discountPercent) / 100), [subtotal, invoice.discountPercent]);
  const amountAfterDiscount = subtotal - discountAmount;
  const transactionValue = amountAfterDiscount + toNum(invoice.freightPackingCharges);
  const cgstAmount = transactionValue * (toNum(invoice.cgstPercent) / 100);
  const sgstAmount = transactionValue * (toNum(invoice.sgstPercent) / 100);
  const igstAmount = transactionValue * (toNum(invoice.igstPercent) / 100);
  const totalAfterTax = transactionValue + cgstAmount + sgstAmount + igstAmount;
  const amountInWords = numberToWords(totalAfterTax);

  const validateAndFocus = () => {
    const nextErrors: Record<string, string> = {};

    if (!invoice.companyName.trim()) nextErrors.companyName = "Company name is required";
    if (!invoice.invoiceNumber.trim()) nextErrors.invoiceNumber = "Invoice number is required";
    if (!invoice.invoiceDate.trim()) nextErrors.invoiceDate = "Invoice date is required";
    if (!invoice.billToName.trim()) nextErrors.billToName = "Bill To name is required";

    for (const row of rows) {
      if (!row.description.trim()) nextErrors[`row-description-${row.id}`] = "Product description is required";
      if (!(row.quantity > 0)) nextErrors[`row-quantity-${row.id}`] = "Quantity must be greater than 0";
    }

    setErrors(nextErrors);

    const firstInvalidKey = Object.keys(nextErrors)[0];
    if (firstInvalidKey) {
      const el = document.getElementById(firstInvalidKey) as HTMLInputElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.focus(), 150);
      }
      toast({
        variant: "destructive",
        title: "Please correct highlighted fields",
        description: nextErrors[firstInvalidKey],
      });
      return false;
    }

    return true;
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        serialNumber: String(prev.length + 1),
        description: "",
        hsnCode: "",
        quantity: 1,
        rate: 0,
      },
    ]);
  };

  const removeRow = (id: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const getInvoiceHtml = () => {
    const lines = rows
      .map(
        (r, i) => `<tr>
          <td>${r.serialNumber || i + 1}</td>
          <td>${r.description}</td>
          <td>${r.hsnCode || "-"}</td>
          <td>${r.quantity}</td>
          <td style="text-align:right;">${formatMoney(r.rate)}</td>
          <td style="text-align:right;">${formatMoney(rowTotals[i])}</td>
        </tr>`
      )
      .join("");

    return `
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 18px; color: #111; }
            .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            table { width:100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border:1px solid #ccc; padding:6px; font-size:12px; vertical-align: top; }
            th { background:#f5f5f5; }
            .title { font-size:20px; font-weight:700; margin-bottom: 8px; }
            .box { border:1px solid #ccc; padding:8px; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="title">Tax Invoice (${docType})</div>
          <div class="grid">
            <div><b>${invoice.companyName}</b><br/>${invoice.companyAddress}<br/>Phone: ${invoice.companyPhone}<br/>GSTIN: ${invoice.companyGstin}</div>
            <div>
              Invoice No: ${invoice.invoiceNumber}<br/>
              Invoice Date: ${invoice.invoiceDate}<br/>
              Transport Mode: ${invoice.transportMode}<br/>
              Cartons: ${invoice.numberOfCartons}<br/>
              Date of Supply: ${invoice.dateOfSupply}<br/>
              State: ${invoice.state} (${invoice.stateCode})<br/>
              Place of Supply: ${invoice.placeOfSupply}<br/>
              Reverse Charge: ${reverseCharge ? "Yes" : "No"}
            </div>
          </div>
          <div class="grid box">
            <div><b>Bill To</b><br/>${invoice.billToName}<br/>${invoice.billToAddress}<br/>GSTIN: ${invoice.billToGstin}<br/>${invoice.billToState} (${invoice.billToStateCode})</div>
            <div><b>Ship To</b><br/>${invoice.shipToName}<br/>${invoice.shipToAddress}<br/>GSTIN: ${invoice.shipToGstin}<br/>${invoice.shipToState} (${invoice.shipToStateCode})</div>
          </div>
          <table>
            <thead><tr><th>S.No</th><th>Description</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
            <tbody>${lines}</tbody>
          </table>
          <table>
            <tr><td>Subtotal</td><td style="text-align:right;">${formatMoney(subtotal)}</td></tr>
            <tr><td>Discount (${invoice.discountPercent}%)</td><td style="text-align:right;">-${formatMoney(discountAmount)}</td></tr>
            <tr><td>Amount after Discount/Rebate</td><td style="text-align:right;">${formatMoney(amountAfterDiscount)}</td></tr>
            <tr><td>Freight/Packing</td><td style="text-align:right;">${formatMoney(toNum(invoice.freightPackingCharges))}</td></tr>
            <tr><td>Transaction Value</td><td style="text-align:right;">${formatMoney(transactionValue)}</td></tr>
            <tr><td>CGST% (${invoice.cgstPercent}%)</td><td style="text-align:right;">${formatMoney(cgstAmount)}</td></tr>
            <tr><td>SGST% (${invoice.sgstPercent}%)</td><td style="text-align:right;">${formatMoney(sgstAmount)}</td></tr>
            <tr><td>IGST% (${invoice.igstPercent}%)</td><td style="text-align:right;">${formatMoney(igstAmount)}</td></tr>
            <tr><td>GST on Reverse Charge</td><td style="text-align:right;">${gstReverseCharge ? "Applicable" : "Not Applicable"}</td></tr>
            <tr><td><b>Total Amount After Tax</b></td><td style="text-align:right;"><b>${formatMoney(totalAfterTax)}</b></td></tr>
          </table>
          <p><b>Amount in Words:</b> ${amountInWords}</p>
          <div class="box">
            <b>Bank Details</b><br/>
            Bank: ${invoice.bankName}<br/>
            A/C No: ${invoice.accountNumber}<br/>
            Branch: ${invoice.branch}<br/>
            IFSC: ${invoice.ifscCode}
          </div>
          <div class="box">
            <b>Terms & Conditions</b><br/>
            1. Goods once sold will not be taken back or refunded.<br/>
            2. ${invoice.termsJurisdiction}<br/>
            3. ${invoice.termsInterest}<br/>
            4. ${invoice.termsResponsibility}
          </div>
          <div class="box"><b>Declaration:</b> Certified that the particulars given above are true and correct.</div>
          <div class="grid" style="margin-top:14px;">
            <div>Authorized Signatory: ${signatureFile || "________________"}</div>
            <div style="text-align:right;">Company Stamp: ${stampFile || "(optional)"}</div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (!validateAndFocus()) return;

    const printHtml = getInvoiceHtml();

    const win = window.open("", "_blank", "width=1000,height=800");
    if (!win) return;
    win.document.write(printHtml);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleSaveAndPrint = async () => {
    if (!validateAndFocus()) return;

    setIsSaving(true);
    try {
      await saveInvoiceRecord({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        customerName: invoice.billToName,
        totalAmount: totalAfterTax,
        payload: {
          invoice,
          rows,
          docType,
          reverseCharge,
          gstReverseCharge,
          summary: {
            subtotal,
            discountAmount,
            amountAfterDiscount,
            transactionValue,
            cgstAmount,
            sgstAmount,
            igstAmount,
            totalAfterTax,
            amountInWords,
          },
        },
      });

      toast({ title: "Invoice saved", description: "Invoice record saved to Supabase." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not save invoice",
        description:
          "Ensure an 'invoices' table exists in Supabase with invoice_number, invoice_date, customer_name, total_amount, payload columns.",
      });
    } finally {
      setIsSaving(false);
    }

    handlePrint();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4">
            <h3 className="col-span-full font-semibold">1. Header Section (Company Details)</h3>
            <div>
              <Label>Company Name *</Label>
              <Input id="companyName" value={invoice.companyName} onChange={(e) => { setInvoice((p) => ({ ...p, companyName: e.target.value })); setErrors((prev) => ({ ...prev, companyName: "" })); }} className={errors.companyName ? "border-destructive" : ""} />
              {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName}</p>}
            </div>
            <div><Label>Phone Number</Label><Input value={invoice.companyPhone} onChange={(e) => setInvoice((p) => ({ ...p, companyPhone: e.target.value }))} /></div>
            <div className="md:col-span-2"><Label>Company Address</Label><Textarea value={invoice.companyAddress} onChange={(e) => setInvoice((p) => ({ ...p, companyAddress: e.target.value }))} /></div>
            <div><Label>GSTIN</Label><Input value={invoice.companyGstin} onChange={(e) => setInvoice((p) => ({ ...p, companyGstin: e.target.value }))} /></div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-md p-4">
            <h3 className="col-span-full font-semibold">2. Invoice Details</h3>
            {[
              ["Invoice Number *", "invoiceNumber"],
              ["Invoice Date *", "invoiceDate"],
              ["Transport Mode", "transportMode"],
              ["Number of Cartons", "numberOfCartons"],
              ["Date of Supply", "dateOfSupply"],
              ["State", "state"],
              ["State Code", "stateCode"],
              ["Place of Supply", "placeOfSupply"],
            ].map(([label, key]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  id={key}
                  type={key.toLowerCase().includes("date") ? "date" : "text"}
                  value={(invoice as Record<string, string>)[key] || ""}
                  onChange={(e) => {
                    setInvoice((p) => ({ ...p, [key]: e.target.value }));
                    setErrors((prev) => ({ ...prev, [key]: "" }));
                  }}
                  className={errors[key] ? "border-destructive" : ""}
                />
                {errors[key] && <p className="text-xs text-destructive mt-1">{errors[key]}</p>}
              </div>
            ))}
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={reverseCharge} onCheckedChange={setReverseCharge} />
              <Label>Reverse Charge (Yes/No)</Label>
            </div>
          </section>

          <section className="border rounded-md p-4 space-y-3">
            <h3 className="font-semibold">3. Document Type Options</h3>
            <RadioGroup value={docType} onValueChange={setDocType} className="flex flex-col md:flex-row md:gap-8">
              <div className="flex items-center gap-2"><RadioGroupItem value="original" id="original" /><Label htmlFor="original">Original for Buyer</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="duplicate" id="duplicate" /><Label htmlFor="duplicate">Duplicate for Transporter</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="triplicate" id="triplicate" /><Label htmlFor="triplicate">Triplicate for Office</Label></div>
            </RadioGroup>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4">
            <h3 className="col-span-full font-semibold">4. Billing Details</h3>
            <div className="space-y-2">
              <h4 className="font-medium">Bill To Party</h4>
              <Input id="billToName" placeholder="Name *" value={invoice.billToName} onChange={(e) => { setInvoice((p) => ({ ...p, billToName: e.target.value })); setErrors((prev) => ({ ...prev, billToName: "" })); }} className={errors.billToName ? "border-destructive" : ""} />
              {errors.billToName && <p className="text-xs text-destructive">{errors.billToName}</p>}
              <Textarea placeholder="Address" value={invoice.billToAddress} onChange={(e) => setInvoice((p) => ({ ...p, billToAddress: e.target.value }))} />
              <Input placeholder="GSTIN" value={invoice.billToGstin} onChange={(e) => setInvoice((p) => ({ ...p, billToGstin: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="State" value={invoice.billToState} onChange={(e) => setInvoice((p) => ({ ...p, billToState: e.target.value }))} />
                <Input placeholder="State Code" value={invoice.billToStateCode} onChange={(e) => setInvoice((p) => ({ ...p, billToStateCode: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Ship To Party</h4>
              <Input placeholder="Name" value={invoice.shipToName} onChange={(e) => setInvoice((p) => ({ ...p, shipToName: e.target.value }))} />
              <Textarea placeholder="Address" value={invoice.shipToAddress} onChange={(e) => setInvoice((p) => ({ ...p, shipToAddress: e.target.value }))} />
              <Input placeholder="GSTIN" value={invoice.shipToGstin} onChange={(e) => setInvoice((p) => ({ ...p, shipToGstin: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="State" value={invoice.shipToState} onChange={(e) => setInvoice((p) => ({ ...p, shipToState: e.target.value }))} />
                <Input placeholder="State Code" value={invoice.shipToStateCode} onChange={(e) => setInvoice((p) => ({ ...p, shipToStateCode: e.target.value }))} />
              </div>
            </div>
          </section>

          <section className="border rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">5. Product Table (Dynamic Rows)</h3>
              <Button type="button" variant="outline" size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1" /> Add Row</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">S.No</th><th className="text-left p-2">Product Description *</th><th className="text-left p-2">HSN Code</th><th className="text-left p-2">Qty</th><th className="text-left p-2">Rate</th><th className="text-left p-2">Total</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-2"><Input value={r.serialNumber} onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, serialNumber: e.target.value } : x)))} /></td>
                      <td className="p-2">
                        <Input id={`row-description-${r.id}`} value={r.description} onChange={(e) => { setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, description: e.target.value } : x))); setErrors((prev) => ({ ...prev, [`row-description-${r.id}`]: "" })); }} className={errors[`row-description-${r.id}`] ? "border-destructive" : ""} />
                        {errors[`row-description-${r.id}`] && <p className="text-xs text-destructive mt-1">{errors[`row-description-${r.id}`]}</p>}
                      </td>
                      <td className="p-2"><Input value={r.hsnCode} onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, hsnCode: e.target.value } : x)))} /></td>
                      <td className="p-2">
                        <Input id={`row-quantity-${r.id}`} type="number" min={1} value={r.quantity} onChange={(e) => { setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, quantity: toNum(e.target.value) || 1 } : x))); setErrors((prev) => ({ ...prev, [`row-quantity-${r.id}`]: "" })); }} className={errors[`row-quantity-${r.id}`] ? "border-destructive" : ""} />
                        {errors[`row-quantity-${r.id}`] && <p className="text-xs text-destructive mt-1">{errors[`row-quantity-${r.id}`]}</p>}
                      </td>
                      <td className="p-2"><Input type="number" min={0} step="0.01" value={r.rate} onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, rate: toNum(e.target.value) } : x)))} /></td>
                      <td className="p-2 font-medium">₹{formatMoney(rowTotals[idx])}</td>
                      <td className="p-2"><Button type="button" variant="ghost" size="icon" onClick={() => removeRow(r.id)}><Trash2 className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4">
            <h3 className="col-span-full font-semibold">6. Invoice Summary</h3>
            <div className="space-y-2">
              <p>Subtotal: ₹{formatMoney(subtotal)}</p>
              <div><Label>Discount (%)</Label><Input type="number" value={invoice.discountPercent} onChange={(e) => setInvoice((p) => ({ ...p, discountPercent: toNum(e.target.value) }))} /></div>
              <p>Amount after Discount/Rebate: ₹{formatMoney(amountAfterDiscount)}</p>
              <div><Label>Freight/Packing Charges</Label><Input type="number" value={invoice.freightPackingCharges} onChange={(e) => setInvoice((p) => ({ ...p, freightPackingCharges: toNum(e.target.value) }))} /></div>
              <p>Transaction Value: ₹{formatMoney(transactionValue)}</p>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>CGST (%)</Label>
                  <Input type="number" value={invoice.cgstPercent} onChange={(e) => setInvoice((p) => ({ ...p, cgstPercent: toNum(e.target.value) }))} />
                </div>
                <p className="self-end">CGST Amt: ₹{formatMoney(cgstAmount)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>SGST (%)</Label>
                  <Input type="number" value={invoice.sgstPercent} onChange={(e) => setInvoice((p) => ({ ...p, sgstPercent: toNum(e.target.value) }))} />
                </div>
                <p className="self-end">SGST Amt: ₹{formatMoney(sgstAmount)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>IGST (%)</Label>
                  <Input type="number" value={invoice.igstPercent} onChange={(e) => setInvoice((p) => ({ ...p, igstPercent: toNum(e.target.value) }))} />
                </div>
                <p className="self-end">IGST Amt: ₹{formatMoney(igstAmount)}</p>
              </div>
              <p className="font-semibold">Total Amount After Tax: ₹{formatMoney(totalAfterTax)}</p>
              <div className="flex items-center gap-2"><Switch checked={gstReverseCharge} onCheckedChange={setGstReverseCharge} /><Label>GST on Reverse Charge</Label></div>
            </div>
          </section>

          <section className="border rounded-md p-4"><h3 className="font-semibold mb-2">7. Amount in Words</h3><Input value={amountInWords} readOnly /></section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4">
            <h3 className="col-span-full font-semibold">8. Bank Details</h3>
            <div><Label>Bank Name</Label><Input value={invoice.bankName} onChange={(e) => setInvoice((p) => ({ ...p, bankName: e.target.value }))} /></div>
            <div><Label>Account Number</Label><Input value={invoice.accountNumber} onChange={(e) => setInvoice((p) => ({ ...p, accountNumber: e.target.value }))} /></div>
            <div><Label>Branch</Label><Input value={invoice.branch} onChange={(e) => setInvoice((p) => ({ ...p, branch: e.target.value }))} /></div>
            <div><Label>IFSC Code</Label><Input value={invoice.ifscCode} onChange={(e) => setInvoice((p) => ({ ...p, ifscCode: e.target.value }))} /></div>
          </section>

          <section className="border rounded-md p-4 space-y-2">
            <h3 className="font-semibold">9. Terms & Conditions</h3>
            <p>• Goods once sold will not be taken back or refunded</p>
            <Textarea value={invoice.termsJurisdiction} onChange={(e) => setInvoice((p) => ({ ...p, termsJurisdiction: e.target.value }))} />
            <Textarea value={invoice.termsInterest} onChange={(e) => setInvoice((p) => ({ ...p, termsInterest: e.target.value }))} />
            <Textarea value={invoice.termsResponsibility} onChange={(e) => setInvoice((p) => ({ ...p, termsResponsibility: e.target.value }))} />
          </section>

          <section className="border rounded-md p-4 space-y-3">
            <h3 className="font-semibold">10. Footer</h3>
            <p>Declaration Text: "Certified that the particulars given above are true and correct"</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Authorized Signatory (upload)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setSignatureFile(e.target.files?.[0]?.name || "")} />
                <p className="text-xs text-muted-foreground mt-1">{signatureFile || "No signature uploaded"}</p>
              </div>
              <div>
                <Label>Company Stamp (optional upload)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setStampFile(e.target.files?.[0]?.name || "")} />
                <p className="text-xs text-muted-foreground mt-1">{stampFile || "No stamp uploaded"}</p>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveAndPrint} disabled={isSaving}>{isSaving ? "Saving..." : "Save & Print"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
