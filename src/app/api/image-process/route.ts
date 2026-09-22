import { NextRequest, NextResponse } from 'next/server';
import { 
  processForMercadoLibre, 
  mattingToWhite,
  submitVisionFlowTask,
  queryVisionFlowResult,
  pollVisionFlowResult,
} from '@/lib/image-processor';

/**
 * Image Processing API for Mercado Libre ERP
 * 
 * POST /api/image-process
 * 
 * Modes:
 * 1. Full pipeline: { sourceUrl } → VisionFlow full pipeline → ML-ready image
 * 2. Simple matting: { sourceUrl, mode: 'matting' } → White background only
 * 3. Submit task: { sourceUrl, mode: 'submit' } → Returns taskId for async polling
 * 4. Query task: { taskId, mode: 'query' } → Returns task status and result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceUrl, mode = 'full', taskId } = body;

    // Mode 4: Query existing task
    if (mode === 'query' && taskId) {
      const result = await queryVisionFlowResult(taskId);
      return NextResponse.json({ success: true, ...result });
    }

    // Modes 1-3 require sourceUrl
    if (!sourceUrl) {
      return NextResponse.json(
        { success: false, error: '缺少 sourceUrl 参数' },
        { status: 400 }
      );
    }

    // Mode 1: Full pipeline (submit + poll)
    if (mode === 'full') {
      const result = await processForMercadoLibre(sourceUrl);
      return NextResponse.json(result);
    }

    // Mode 2: Simple white background matting
    if (mode === 'matting') {
      const result = await mattingToWhite({
        imageUrl: sourceUrl,
        targetWidth: 1000,
        targetHeight: 1000,
      });
      return NextResponse.json(result);
    }

    // Mode 3: Submit async task only
    if (mode === 'submit') {
      const result = await submitVisionFlowTask({
        imageUrl: sourceUrl,
        abilities: [1, 3, 2, 6, 7],
        backgroundType: 'WHITE_BACKGROUND',
        targetWidth: 1000,
        targetHeight: 1000,
        upscaleFactor: 2,
        nonobjectDetectElements: [1, 2, 3, 4],
        nonobjectRemoveElements: [1, 3, 4],
        isFilter: true,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: `未知模式: ${mode}，支持 full/matting/submit/query` },
      { status: 400 }
    );
  } catch (err) {
    console.error('Image process API error:', err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
