import { NextRequest, NextResponse } from 'next/server';

// 通义万相 - 图像背景生成 API
// 文档: https://help.aliyun.com/zh/model-studio/wanx-background-generation-api-reference

const DASHSCOPE_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/background-generation/generation';
const TASK_QUERY_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/tasks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { sourceImageUrl, prompt, refImageUrl, n = 2, mode = 'default' } = body;

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'DASHSCOPE_API_KEY 未配置' },
        { status: 500 }
      );
    }

    // 如果输入图不是透明底 PNG，先通过 VisionFlow 抠图
    if (mode === 'auto' && sourceImageUrl) {
      try {
        const mattingRes = await fetch(`${request.nextUrl.origin}/api/image-process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceUrl: sourceImageUrl,
            mode: 'matting',
          }),
        });
        const mattingData = await mattingRes.json();
        if (mattingData.success && mattingData.imageUrl) {
          sourceImageUrl = mattingData.imageUrl;
        }
      } catch {
        // 抠图失败，继续用原图尝试
      }
    }

    if (!sourceImageUrl) {
      return NextResponse.json(
        { success: false, error: '缺少 sourceImageUrl 参数' },
        { status: 400 }
      );
    }

    // 构建通义万相请求
    const input: any = {
      base_image_url: sourceImageUrl,
    };

    if (prompt) input.ref_prompt = prompt;
    if (refImageUrl) input.ref_image_url = refImageUrl;

    if (!prompt && !refImageUrl) {
      input.ref_prompt = 'professional product photography on clean white surface, soft studio lighting, e-commerce style';
    }

    // Step 1: 提交异步任务
    const submitRes = await fetch(DASHSCOPE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: 'wanx-background-generation-v2',
        input,
        parameters: {
          n: Math.min(4, Math.max(1, n)),
          model_version: 'v3', // v3 效果更好
        },
      }),
    });

    const submitData = await submitRes.json();
    if (!submitData.output?.task_id) {
      return NextResponse.json(
        { success: false, error: submitData.message || '提交任务失败', detail: submitData },
        { status: 500 }
      );
    }

    const taskId = submitData.output.task_id;

    // Step 2: 轮询等待结果 (最多3分钟)
    let lastStatus = 'PENDING';
    for (let i = 0; i < 45; i++) {
      await new Promise(r => setTimeout(r, 4000));

      const queryRes = await fetch(`${TASK_QUERY_ENDPOINT}/${taskId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const queryData = await queryRes.json();
      lastStatus = queryData.output?.task_status;

      if (lastStatus === 'SUCCEEDED') {
        const results = queryData.output.results || [];
        return NextResponse.json({
          success: true,
          taskId,
          images: results.map((r: any) => r.url).filter(Boolean),
          count: results.length,
        });
      }

      if (lastStatus === 'FAILED') {
        return NextResponse.json({
          success: false,
          taskId,
          error: queryData.output?.message || queryData.output?.code || '图片生成失败',
          detail: queryData.output,
        });
      }

      // PENDING / RUNNING → 继续等
    }

    return NextResponse.json({
      success: false,
      taskId,
      error: `生成超时（最后状态: ${lastStatus}），请稍后重试`,
    });

  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
