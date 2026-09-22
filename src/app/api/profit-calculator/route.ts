import { NextRequest, NextResponse } from 'next/server';

const rates: Record<string, { commission: number; logistics: number }> = {
  MLB: { commission: 13, logistics: 65 },
  MLM: { commission: 12.5, logistics: 58 },
  MCO: { commission: 15, logistics: 70 },
  MLA: { commission: 14, logistics: 72 },
  MLC: { commission: 14.5, logistics: 68 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { purchasePrice, sellingPrice, weight, length = 10, width = 10, height = 10, site = 'MLM' } = body;
    
    const rate = rates[site] || rates.MLM;
    const usdToCny = 7.2;
    const paymentFeeRate = 0.015;
    
    const volWeight = (length * width * height) / 6000;
    const actualWeight = Math.max((weight || 100) / 1000, volWeight);
    const logisticsCost = actualWeight * rate.logistics;
    
    const purchaseUsd = (purchasePrice || 10) / usdToCny;
    const commissionUsd = (sellingPrice || 15) * (rate.commission / 100);
    const paymentUsd = (sellingPrice || 15) * paymentFeeRate;
    const totalCost = purchaseUsd + logisticsCost / usdToCny + commissionUsd + paymentUsd;
    const profit = (sellingPrice || 15) - totalCost;
    const profitRate = (sellingPrice || 15) > 0 ? (profit / (sellingPrice || 15)) * 100 : 0;

    return NextResponse.json({
      purchasePrice: purchaseUsd,
      commission: commissionUsd,
      paymentFee: paymentUsd,
      logisticsCost: logisticsCost / usdToCny,
      totalCost,
      profit,
      profitRate: profitRate.toFixed(1),
      site,
      mock: true,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
