/**
 * 1688 采集图片的 AI 视觉分类 + 同款一致性校验
 * 模型：qwen-vl-max（兼容模式）
 * 输入产品标题 + 多张图片，批量返回每张图的角色与是否同款。
 * 无 Key 时返回 null，由上层降级为规则层结果。
 */

const DEFAULT_ENDPOINT = 'https://ws-9tyny6h9m7c7ksr8.cn-beijing.maas.aliyuncs.com/compatible-mode/v1';
const VL_MODEL = 'qwen-vl-max';

function getApiKey(): string | undefined {
  return process.env.DECISION_MODEL_API_KEY || process.env.DASHSCOPE_API_KEY || undefined;
}

export function isVisionEnabled(): boolean {
  return Boolean(getApiKey());
}

export interface VisionImageResult {
  index: number;
  role: 'main' | 'detail' | 'sku' | 'scene' | 'irrelevant';
  sameProduct: boolean;
  whiteBg: boolean;
  quality: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * 批量视觉分析。
 * @param title 产品标题/关键词，用于判定同款
 * @param imageUrls 待分析图片（限制最多 12 张，避免超长）
 */
export async function classifyImagesVision(
  title: string,
  imageUrls: string[],
): Promise<VisionImageResult[] | null> {
  const apiKey = getApiKey();
  if (!apiKey || imageUrls.length === 0) return null;

  const urls = imageUrls.slice(0, 12);

  const content: unknown[] = [
    {
      type: 'text',
      text: `这是一款1688货源商品：「${title}」。下面按顺序给出该商品详情页提取的${urls.length}张图片（编号1开始）。
请逐张判断：
1. role 图片类型：main=干净的产品主图(适合做美客多首图) / sku=颜色规格变体图 / detail=细节特写或功能说明图 / scene=使用场景图 / irrelevant=与本商品无关的图(店招、海报、其它产品、模特无关物、认证图标等)
2. sameProduct：图中主体是否就是「${title}」这同一款产品（混入其它款产品则 false）
3. whiteBg：是否纯白/浅色干净背景
4. quality：图片清晰度 high/medium/low

输出严格 JSON（不要 markdown 代码块、不要解释）：
{"results":[{"index":1,"role":"main","sameProduct":true,"whiteBg":true,"quality":"high","reason":"简短中文理由"}]}`,
    },
  ];
  urls.forEach((u, i) => {
    content.push({ type: 'text', text: `图片${i + 1}：` });
    content.push({ type: 'image_url', image_url: { url: u } });
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(`${DEFAULT_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: VL_MODEL,
        messages: [{ role: 'user', content }],
        temperature: 0.1,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content || '';
    const json = extractJson(text);
    if (!json || !Array.isArray(json.results)) return null;
    return json.results as VisionImageResult[];
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractJson(text: string): { results: VisionImageResult[] } | null {
  if (!text) return null;
  // 去掉可能的 ```json 包裹
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
