import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';
import { MELI_CONFIG } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ success: false, error: '请先授权美客多账号' }, { status: 401 });
    }

    const body = await request.json();
    const {
      category_id,
      title,
      description,
      price,
      available_quantity,
      condition,
      free_shipping,
      images,
    } = body;

    if (!category_id || !title || !price || !available_quantity || !images || images.length === 0) {
      return NextResponse.json({ success: false, error: '缺少必填字段' }, { status: 400 });
    }

    // Upload images first
    const uploadedPictures = [];
    for (const imageBase64 of images) {
      // Remove data:image/xxx;base64, prefix
      const base64Data = imageBase64.split(',')[1];
      const mimeMatch = imageBase64.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const formData = new FormData();
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      formData.append('file', blob, 'image.jpg');

      const uploadResponse = await fetch(`${MELI_CONFIG.apiBase}/pictures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Image upload failed:', errorText);
        return NextResponse.json({ success: false, error: `图片上传失败: ${uploadResponse.status}` }, { status: 500 });
      }

      const pictureData = await uploadResponse.json();
      uploadedPictures.push({ id: pictureData.id });
    }

    // Create item
    const itemData = {
      title: title.trim(),
      category_id,
      price: Number(price),
      currency_id: 'BRL',
      available_quantity: Number(available_quantity),
      buying_mode: 'buy_it_now',
      sale_terms: [],
      description: {
        plain_text: description || '',
      },
      pictures: uploadedPictures,
      condition: condition || 'new',
      free_shipping: free_shipping ? { mode: 'me2' } : undefined,
      listing_type_id: free_shipping ? 'gold_special' : 'gold_mini',
    };

    const createResponse = await fetch(`${MELI_CONFIG.apiBase}/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });

    const result = await createResponse.json();

    if (!createResponse.ok) {
      console.error('Item creation failed:', result);
      const errorMessage = result.cause?.[0]?.message || result.message || '发布失败';
      return NextResponse.json({ success: false, error: errorMessage, details: result }, { status: createResponse.status });
    }

    return NextResponse.json({
      success: true,
      itemId: result.id,
      permalink: result.permalink,
      message: '商品发布成功',
    });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ success: false, error: '网络错误，请重试' }, { status: 500 });
  }
}
