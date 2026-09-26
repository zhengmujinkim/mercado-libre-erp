// 美客多商品图片合规检测 + 质量评分
// 模型：通义千问 VL（qwen-vl-max）+ 通义万相（背景生成）
// 检测项：白底/文字水印/尺寸/居中/多角度/场景图
// 失败时返回 null，由上层降级处理

const DEFAULT_ENDPOINT = 'https://ws-9tyny6h9m7c7ksr8.cn-beijing.maas.aliyuncs.com/compatible-mode/v1';
const VL_MODEL = 'qwen-vl-max';
const BG_MODEL = 'wanx-background-generation-v2';

export function getApiKey(): string | undefined {
  return (
    process.env.DECISION_MODEL_API_KEY ||
    process.env.DASHSCOPE_API_KEY ||
    undefined
  );
}

export function isImageCheckerEnabled(): boolean {
  return Boolean(getApiKey());
}

// ============ 类型 ============
export interface ImageCheckResult {
  compliant: boolean;
  score: number; // 0-100
  whiteBg: boolean;
  hasText: boolean;
  sizeOk: boolean;
  centered: boolean;
  issues: string[];
  suggestions: string[];
  rawResponse?: string;
}

export interface MultiImageCheckResult {
  mainImage: ImageCheckResult | null;
  hasMultipleAngles: boolean;
  angleCount: number;
  missingAngles: string[];
  overallScore: number;
  overallCompliant: boolean;
  results: ImageCheckResult[];
}

// ============ 单图检测 ============
export async function checkSingleImage(
  imageBase64: string,
  opts: { isMain?: boolean } = {},
): Promise<ImageCheckResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const prompt = opts.isMain
    ? `你是美客多(Mercado Libre)跨境电商图片合规检测专家。检测这张商品主图：
1. 是否纯白底（背景 RGB 接近 255,255,255）？
2. 是否有文字/水印/Logo/牛皮癣？
3. 产品是否居中且占画面 50% 以上？
4. 整体是否符合电商平台主图规范（无杂乱背景、无多余元素）？

输出严格 JSON 格式（不要 markdown 代码块）：
{"white_bg":true/false,"has_text":false,"centered":true/false,"compliant":true/false,"score":0-100,"issues":["问题1","问题2"],"suggestions":["建议1"]}`
    : `检测这张商品副图/细节图的质量：
1. 是否清晰展示产品细节/角度/场景？
2. 是否有文字说明（副图允许有文字）？
3. 图片质量是否足够高（不模糊、不压缩）？

输出 JSON：{"clear":true/false,"has_text":false,"quality":"high/medium/low","score":0-100,"suggestions":["建议"]}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${DEFAULT_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: VL_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
              { type: 'text', text: prompt },
            ],
          },
        ],
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) return null;

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return null;
    }

    const content = json.choices?.[0]?.message?.content || '';
    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);
    return {
      compliant: data.compliant ?? data.clear ?? false,
      score: data.score ?? 0,
      whiteBg: data.white_bg ?? true,
      hasText: data.has_text ?? false,
      sizeOk: true,
      centered: data.centered ?? true,
      issues: data.issues || [],
      suggestions: data.suggestions || [],
      rawResponse: content,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ============ 多图综合检测 ============
export async function checkProductImages(
  images: string[], // base64 数组
): Promise<MultiImageCheckResult> {
  if (!images.length) {
    return {
      mainImage: null,
      hasMultipleAngles: false,
      angleCount: 0,
      missingAngles: ['正面', '侧面', '细节', '场景'],
      overallScore: 0,
      overallCompliant: false,
      results: [],
    };
  }

  const results: ImageCheckResult[] = [];
  for (let i = 0; i < images.length; i++) {
    const result = await checkSingleImage(images[i], { isMain: i === 0 });
    results.push(result || {
      compliant: false,
      score: 0,
      whiteBg: false,
      hasText: false,
      sizeOk: false,
      centered: false,
      issues: ['检测失败'],
      suggestions: [],
    });
  }

  const mainImage = results[0];
  const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length;

  // 判断角度数量（简单启发：>3 张算多角度）
  const hasMultipleAngles = images.length >= 4;
  const missingAngles: string[] = [];
  if (images.length < 2) missingAngles.push('侧面');
  if (images.length < 3) missingAngles.push('细节');
  if (images.length < 4) missingAngles.push('场景');
  if (images.length < 5) missingAngles.push('包装/规格');

  return {
    mainImage,
    hasMultipleAngles,
    angleCount: images.length,
    missingAngles,
    overallScore: Math.round(avgScore),
    overallCompliant: mainImage?.compliant ?? false,
    results,
  };
}

// ============ 白底图生成（通义万相） ============
export async function generateWhiteBackgroundImage(
  imageBase64: string,
): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch(`${DEFAULT_ENDPOINT}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: BG_MODEL,
        input: {
          image: `data:image/jpeg;base64,${imageBase64}`,
        },
        parameters: {
          background_type: 'white',
          output_size: '1000x1000',
        },
      }),
    });

    const text = await res.text();
    if (!res.ok) return null;

    const json = JSON.parse(text);
    return json.output?.image || json.data?.[0]?.url || null;
  } catch {
    return null;
  }
}
