/**
 * 轻量图片探测：下载图片，读取字节数 / 类型 / 宽高
 * 无外部依赖，仅解析文件头（JPEG / PNG / WebP）。
 */

export interface ImageProbeResult {
  ok: boolean;
  bytes: number;
  contentType: string;
  width?: number;
  height?: number;
  error?: string;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Referer: 'https://detail.1688.com/',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

/** 从 Buffer 解析图片宽高 */
export function parseDimensions(buf: Buffer): { width?: number; height?: number } {
  try {
    // PNG: 89 50 4E 47, IHDR width/height at 16..23
    if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }

    // JPEG: FF D8
    if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let offset = 2;
      while (offset < buf.length) {
        if (buf[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buf[offset + 1];
        // SOF0..SOF15 except DHT(C4), JPG(C8), DAC(CC)
        if (
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc
        ) {
          if (offset + 9 < buf.length) {
            return {
              height: buf.readUInt16BE(offset + 5),
              width: buf.readUInt16BE(offset + 7),
            };
          }
        }
        const segLen = buf.readUInt16BE(offset + 2);
        offset += 2 + segLen;
      }
    }

    // WebP: RIFF .... WEBP
    if (
      buf.length >= 30 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    ) {
      const type = buf.toString('ascii', 12, 16);
      if (type === 'VP8 ') {
        // 关键帧：偏移23-24 0x9d 0x01 0x2a，宽高在 26..
        return {
          width: buf.readUInt16LE(26) & 0x3fff,
          height: buf.readUInt16LE(28) & 0x3fff,
        };
      }
      if (type === 'VP8L') {
        const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
        const width = 1 + (((b1 & 0x3f) << 8) | b0);
        const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
        return { width, height };
      }
      if (type === 'VP8X') {
        const width = 1 + ((buf[24] | (buf[25] << 8) | (buf[26] << 16)) >>> 0);
        const height = 1 + ((buf[27] | (buf[28] << 8) | (buf[29] << 16)) >>> 0);
        return { width, height };
      }
    }
  } catch {
    /* ignore parse errors */
  }
  return {};
}

/** 下载并探测单张图片 */
export async function probeImage(url: string): Promise<ImageProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      return { ok: false, bytes: 0, contentType: res.headers.get('content-type') || '', error: `HTTP ${res.status}` };
    }
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const dim = parseDimensions(buf);
    return {
      ok: true,
      bytes: buf.length,
      contentType: res.headers.get('content-type') || '',
      width: dim.width,
      height: dim.height,
    };
  } catch (e) {
    return { ok: false, bytes: 0, contentType: '', error: (e as Error).message || 'fetch error' };
  } finally {
    clearTimeout(timer);
  }
}
