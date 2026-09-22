// Alibaba Cloud VisionFlow (智能出图) Configuration
// Docs: https://help.aliyun.com/zh/aidge/api-aidge-2026-04-28-visionflow

export const ALIYUN_CONFIG = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
  // VisionFlow endpoint (async API)
  visionFlowEndpoint: 'https://aidge.cn-shanghai.aliyuncs.com',
  // ImageMatting endpoint (sync API, simpler)
  imageMattingEndpoint: 'https://aidge.cn-shanghai.aliyuncs.com',
};

// VisionFlow ability codes
export const VISION_ABILITIES = {
  ELEMENT_DETECT: 1,    // 智能元素识别（检测水印/logo/文字）
  IMAGE_MATTING: 2,     // 智能抠图（白底/透明底）
  SMART_ERASE: 3,       // 智能消除（擦除文字/logo/牛皮癣）
  IMAGE_TRANSLATE: 4,   // 图片翻译 Pro
  IMAGE_EXPAND: 5,      // 图像扩展
  SMART_CROP: 6,        // 智能裁剪
  HD_UPSCALE: 7,        // 高清放大
} as const;

// Detectable/removable element types
export const ELEMENT_TYPES = {
  WATERMARK: 1,   // 水印
  LOGO: 2,        // Logo
  TEXT: 3,        // 文字
  COLOR_BLOCK: 4, // 含字色块/牛皮癣
} as const;

// Mercado Libre image quality standard
export const ML_IMAGE_STANDARD = {
  minWidth: 500,
  minHeight: 500,
  recommendedWidth: 1000,
  recommendedHeight: 1000,
  maxWidth: 2000,
  maxHeight: 2000,
  backgroundType: 'WHITE_BACKGROUND' as const,
};
