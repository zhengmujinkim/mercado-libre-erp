// alicdn 服务端取图：多镜像轮换 + 浏览器全套请求头，绕过防盗链/单IP风控
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const ALLOWED_HOSTS = [
  'cbu01.alicdn.com',
  'cbu02.alicdn.com',
  'cbu03.alicdn.com',
  'cbu04.alicdn.com',
  'gw.alicdn.com',
  'img.alicdn.com',
  'sc01.alicdn.com',
  'sc02.alicdn.com',
  'sc03.alicdn.com',
  'sc04.alicdn.com',
];

const HOST_MIRRORS = ['cbu01', 'cbu02', 'cbu03', 'cbu04'].map((h) => `${h}.alicdn.com`);

export function isAllowedAlicdnHost(hostname: string): boolean {
  return ALLOWED_HOSTS.includes(hostname);
}

export interface AlicdnResult {
  ok: boolean;
  buf: ArrayBuffer;
  contentType: string;
  usedHost: string;
  attempts: Array<{ host: string; status: number; bytes: number }>;
}

function browserHeaders(host: string): Record<string, string> {
  return {
    'User-Agent': UA,
    Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    Referer: 'https://detail.1688.com/',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Dest': 'image',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'cross-site',
  };
}

export async function fetchFromAlicdn(target: URL): Promise<AlicdnResult> {
  const attempts: AlicdnResult['attempts'] = [];

  // 镜像候选：原主机优先，然后 cbu01-04 轮换
  const hosts = [target.hostname, ...HOST_MIRRORS.filter((h) => h !== target.hostname)];
  const seen = new Set<string>();

  for (const host of hosts) {
    if (seen.has(host)) continue;
    seen.add(host);

    const url = new URL(target.toString());
    url.hostname = host;

    let status = 0;
    let bytes = 0;
    try {
      const resp = await fetch(url.toString(), {
        headers: browserHeaders(host),
        cache: 'no-store',
      });
      status = resp.status;
      const buf = await resp.arrayBuffer();
      bytes = buf.byteLength;
      attempts.push({ host, status, bytes });

      // 真图标准：状态2xx 且大于1000字节（防盗链占位GIF约49字节）
      if (resp.ok && bytes > 1000) {
        return {
          ok: true,
          buf,
          contentType: resp.headers.get('content-type') || 'image/jpeg',
          usedHost: host,
          attempts,
        };
      }
    } catch (e) {
      attempts.push({ host, status: status || -1, bytes });
    }
  }

  return {
    ok: false,
    buf: new ArrayBuffer(0),
    contentType: 'image/jpeg',
    usedHost: '',
    attempts,
  };
}
