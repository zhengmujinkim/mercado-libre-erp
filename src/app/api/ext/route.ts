import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";

type Source = "meli" | "1688";

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  soldCount: number;
  rating: number;
  reviews: number;
  seller: string;
  url: string;
  imageUrl: string;
  category: string;
  source: Source;
  site: string;
  pushedAt: string;
  extra: Record<string, unknown>;
}

const KV_KEY = 'ext_data';

async function loadProducts(): Promise<Product[]> {
  const data = await kvGet<Product[]>(KV_KEY);
  return data || [];
}

async function saveProducts(items: Product[]): Promise<void> {
  await kvSet(KV_KEY, items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const list: Product[] = Array.isArray(body) ? body : [body];
    const items = await loadProducts();

    for (const p of list) {
      items.unshift({
        id: p.id || `${p.source}-${Date.now()}`,
        title: p.title || "",
        price: p.price || 0,
        currency: p.currency || "MXN",
        soldCount: p.soldCount || 0,
        rating: p.rating || 0,
        reviews: p.reviews || 0,
        seller: p.seller || "",
        url: p.url || "",
        imageUrl: p.imageUrl || "",
        category: p.category || "",
        source: (p.source as Source) || "meli",
        site: p.site || "",
        pushedAt: p.pushedAt || new Date().toISOString(),
        extra: p.extra || {},
      });
    }
    while (items.length > 200) items.pop();
    await saveProducts(items);
    return NextResponse.json({ success: true, count: items.length });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

export async function GET() {
  const items = await loadProducts();
  return NextResponse.json({ products: items, total: items.length });
}

export async function DELETE() {
  await saveProducts([]);
  return NextResponse.json({ success: true });
}
