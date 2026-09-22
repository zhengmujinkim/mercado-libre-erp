// Alibaba Cloud VisionFlow API Client
// Handles request signing and API calls for e-commerce image processing

import { ALIYUN_CONFIG, VISION_ABILITIES, ELEMENT_TYPES, ML_IMAGE_STANDARD } from './aliyun-config';

// --- Alibaba Cloud Request Signing ---

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~');
}

function computeSignature(params: Record<string, string>, method: string, secret: string): string {
  // 1. Sort parameters by key
  const sortedKeys = Object.keys(params).sort();
  
  // 2. Build canonicalized query string
  const canonicalized = sortedKeys
    .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join('&');
  
  // 3. Build string to sign
  const stringToSign = `${method}&${percentEncode('/')}&${percentEncode(canonicalized)}`;
  
  // 4. Sign with HMAC-SHA1
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha1', secret + '&');
  hmac.update(stringToSign);
  return hmac.digest('base64');
}

function buildSignedUrl(path: string, params: Record<string, string>, method = 'POST'): string {
  const { accessKeyId, accessKeySecret } = ALIYUN_CONFIG;
  
  // Add common parameters
  const allParams = {
    ...params,
    AccessKeyId: accessKeyId,
    Format: 'JSON',
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: Date.now().toString() + Math.random().toString(36).slice(2, 8),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2026-04-28',
  };
  
  // Compute signature
  const signature = computeSignature(allParams, method, accessKeySecret);
  allParams.Signature = signature;
  
  // Build URL
  const queryString = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join('&');
  
  return `${ALIYUN_CONFIG.imageMattingEndpoint}${path}?${queryString}`;
}

// --- VisionFlow API ---

export interface VisionFlowRequest {
  imageUrl: string;
  abilities: number[];           // Which abilities to use (1-7)
  backgroundType?: string;       // WHITE_BACKGROUND | TRANSPARENT
  targetWidth?: number;
  targetHeight?: number;
  upscaleFactor?: number;        // 2-4
  // Element detection config
  objectDetectElements?: number[];
  nonobjectDetectElements?: number[];
  isFilter?: boolean;
  // Element removal config
  objectRemoveElements?: number[];
  nonobjectRemoveElements?: number[];
  // Translation config
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface VisionFlowResult {
  taskId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
}

/**
 * Submit a VisionFlow image processing task (async)
 */
export async function submitVisionFlowTask(request: VisionFlowRequest): Promise<VisionFlowResult> {
  const { accessKeyId, accessKeySecret } = ALIYUN_CONFIG;
  
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('阿里云 AccessKey 未配置，请在环境变量中设置 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET');
  }
  
  // Build request body
  const body: Record<string, any> = {
    ImageUrl: request.imageUrl,
    Ability: request.abilities,
    BackGroundType: request.backgroundType || ML_IMAGE_STANDARD.backgroundType,
  };
  
  // Element detection
  if (request.nonobjectDetectElements?.length) {
    body.NonobjectDetectElements = request.nonobjectDetectElements;
    body.IsFilter = request.isFilter ?? true;
  }
  if (request.objectDetectElements?.length) {
    body.ObjectDetectElements = request.objectDetectElements;
    body.IsFilter = request.isFilter ?? true;
  }
  
  // Element removal
  if (request.nonobjectRemoveElements?.length) {
    body.NonobjectRemoveElements = request.nonobjectRemoveElements;
  }
  if (request.objectRemoveElements?.length) {
    body.ObjectRemoveElements = request.objectRemoveElements;
  }
  
  // Translation
  if (request.sourceLanguage && request.targetLanguage) {
    body.SourceLanguage = request.sourceLanguage;
    body.TargetLanguage = request.targetLanguage;
  }
  
  // Crop
  if (request.targetWidth && request.abilities.includes(VISION_ABILITIES.SMART_CROP)) {
    body.TargetWidth = request.targetWidth;
    body.TargetHeight = request.targetHeight || request.targetWidth;
  }
  
  // Upscale
  if (request.upscaleFactor && request.abilities.includes(VISION_ABILITIES.HD_UPSCALE)) {
    body.UpscaleFactor = Math.min(4, Math.max(2, request.upscaleFactor));
  }
  
  // Sign and send
  const path = '/rest/ai/image/visionflow';
  const signedUrl = buildSignedUrl(path, { Action: 'VisionFlow' });
  
  const response = await fetch(signedUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  
  if (data.Code !== 'success') {
    return {
      taskId: '',
      status: 'failed',
      error: `${data.Code}: ${data.Message}`,
    };
  }
  
  return {
    taskId: data.Data?.TaskId || '',
    status: 'submitted',
  };
}

/**
 * Query VisionFlow task result
 */
export async function queryVisionFlowResult(taskId: string): Promise<VisionFlowResult> {
  const path = '/rest/ai/task/queryTaskResult';
  const signedUrl = buildSignedUrl(path, { Action: 'QueryTaskResult', TaskId: taskId });
  
  const response = await fetch(signedUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ TaskId: taskId }),
  });
  
  const data = await response.json();
  
  if (data.Code !== 'success') {
    return {
      taskId,
      status: 'failed',
      error: `${data.Code}: ${data.Message}`,
    };
  }
  
  const taskData = data.Data || {};
  const taskStatus = taskData.TaskStatus || taskData.Status || 'processing';
  
  return {
    taskId,
    status: taskStatus === 'completed' || taskStatus === 'SUCCEEDED' ? 'completed' : 
            taskStatus === 'failed' || taskStatus === 'FAILED' ? 'failed' : 'processing',
    imageUrl: taskData.ImageUrl || taskData.Result?.ImageUrl,
    error: taskStatus === 'failed' ? taskData.ErrorMessage : undefined,
  };
}

/**
 * Poll for task completion
 */
export async function pollVisionFlowResult(
  taskId: string, 
  maxWait = 60000, 
  interval = 3000
): Promise<VisionFlowResult> {
  const start = Date.now();
  
  while (Date.now() - start < maxWait) {
    const result = await queryVisionFlowResult(taskId);
    
    if (result.status === 'completed') return result;
    if (result.status === 'failed') return result;
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return { taskId, status: 'failed', error: 'Task timed out' };
}

// --- ImageMatting API (simpler, sync) ---

export interface MattingRequest {
  imageUrl: string;
  backgroundType?: 'WHITE_BACKGROUND' | 'TRANSPARENT';
  targetWidth?: number;
  targetHeight?: number;
  bgColor?: string;
}

export interface MattingResult {
  success: boolean;
  imageUrl?: string;
  width?: number;
  height?: number;
  score?: number;
  error?: string;
}

/**
 * Simple white background matting (sync API)
 */
export async function mattingToWhite(request: MattingRequest): Promise<MattingResult> {
  const { accessKeyId, accessKeySecret } = ALIYUN_CONFIG;
  
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('阿里云 AccessKey 未配置');
  }
  
  const body: Record<string, any> = {
    ImageUrl: request.imageUrl,
    BackGroundType: request.backgroundType || 'WHITE_BACKGROUND',
  };
  
  if (request.targetWidth) body.TargetWidth = request.targetWidth;
  if (request.targetHeight) body.TargetHeight = request.targetHeight;
  if (request.bgColor) body.BgColor = request.bgColor;
  
  const path = '/rest/ai/image/matting';
  const signedUrl = buildSignedUrl(path, { Action: 'ImageMatting' });
  
  try {
    const response = await fetch(signedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (data.Code !== 'success') {
      return {
        success: false,
        error: `${data.Code}: ${data.Message}`,
      };
    }
    
    return {
      success: true,
      imageUrl: data.Data?.ImageUrl,
      width: data.Data?.Width,
      height: data.Data?.Height,
      score: data.Data?.Score,
    };
  } catch (err) {
    return {
      success: false,
      error: String(err),
    };
  }
}

// --- High-Level Pipeline ---

/**
 * Full ML-ready image processing pipeline
 * Input: any product image URL (e.g., from 1688)
 * Output: clean white background image ready for Mercado Libre
 */
export async function processForMercadoLibre(sourceImageUrl: string): Promise<{
  success: boolean;
  imageUrl?: string;
  taskId?: string;
  error?: string;
}> {
  try {
    // Submit VisionFlow task with full pipeline:
    // 1. Detect elements (watermark, logo, text, color blocks)
    // 2. Remove detected elements
    // 3. Matte to white background
    // 4. Crop to 1000x1000
    // 5. Upscale 2x for quality
    const result = await submitVisionFlowTask({
      imageUrl: sourceImageUrl,
      abilities: [
        VISION_ABILITIES.ELEMENT_DETECT,
        VISION_ABILITIES.SMART_ERASE,
        VISION_ABILITIES.IMAGE_MATTING,
        VISION_ABILITIES.SMART_CROP,
        VISION_ABILITIES.HD_UPSCALE,
      ],
      backgroundType: ML_IMAGE_STANDARD.backgroundType,
      targetWidth: ML_IMAGE_STANDARD.recommendedWidth,
      targetHeight: ML_IMAGE_STANDARD.recommendedHeight,
      upscaleFactor: 2,
      nonobjectDetectElements: [
        ELEMENT_TYPES.WATERMARK,
        ELEMENT_TYPES.LOGO,
        ELEMENT_TYPES.TEXT,
        ELEMENT_TYPES.COLOR_BLOCK,
      ],
      nonobjectRemoveElements: [
        ELEMENT_TYPES.WATERMARK,
        ELEMENT_TYPES.TEXT,
        ELEMENT_TYPES.COLOR_BLOCK,
      ],
      isFilter: true,
    });
    
    if (result.status === 'failed') {
      return { success: false, error: result.error };
    }
    
    // Poll for completion
    const final = await pollVisionFlowResult(result.taskId);
    
    if (final.status === 'completed' && final.imageUrl) {
      return {
        success: true,
        imageUrl: final.imageUrl,
        taskId: result.taskId,
      };
    }
    
    return {
      success: false,
      taskId: result.taskId,
      error: final.error || 'Processing failed',
    };
  } catch (err) {
    return {
      success: false,
      error: String(err),
    };
  }
}
