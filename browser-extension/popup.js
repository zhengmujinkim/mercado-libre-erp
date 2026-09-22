const ERP_BASE = 'https://mercado-libre-erp.vercel.app';
const MELI_HOSTS = [
  'mercadolibre.com', 'mercadolibre.com.mx', 'mercadolivre.com.br',
  'mercadolibre.com.ar', 'mercadolibre.cl', 'mercadolibre.com.co',
];

const statusEl = document.getElementById('status');
const pushBtn = document.getElementById('pushBtn');
const batchBtn = document.getElementById('batchBtn');
const msgEl = document.getElementById('msg');
const storeCountEl = document.getElementById('storeCount');

async function refreshStoreCount() {
  try {
    const res = await fetch(`${ERP_BASE}/api/browser-extension?limit=1`);
    const data = await res.json();
    storeCountEl.textContent = `ERP 暂存：${data.total || 0} 条`;
  } catch {
    storeCountEl.textContent = 'ERP 暂存：(无法连接)';
  }
}

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = `status ${type}`;
}

async function init() {
  await refreshStoreCount();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    setStatus('无法读取当前标签页', 'bad');
    return;
  }

  const url = new URL(tab.url);
  const host = url.host.toLowerCase();
  const isMeli = MELI_HOSTS.some(h => host.includes(h));
  const is1688 = host.includes('1688.com');

  if (isMeli) {
    const site = host.includes('.br') ? '巴西' :
                 host.includes('.ar') ? '阿根廷' :
                 host.includes('.cl') ? '智利' :
                 host.includes('.co') ? '哥伦比亚' : '墨西哥';
    setStatus(`✓ 美客多 ${site} 站点`, 'ok');
    pushBtn.disabled = false;
    // 判断是否是列表页
    const isList = !tab.url.match(/MLM|MLB|MLA|MLC|MCO|-M/i) &&
                   (tab.url.includes('/search') || tab.url.includes('/list') || url.pathname === '/');
    if (isList) {
      batchBtn.style.display = 'block';
    }
  } else if (is1688) {
    setStatus('✓ 1688 供应端页面', 'ok');
    pushBtn.disabled = false;
    pushBtn.textContent = '🏭 推送 1688 供应商信息到 ERP';
  } else {
    setStatus(`当前站点不支持：${host}\n请打开美客多或 1688 页面`, 'bad');
    pushBtn.disabled = true;
  }
}

pushBtn.addEventListener('click', async () => {
  pushBtn.disabled = true;
  pushBtn.textContent = '推送中...';
  msgEl.textContent = '';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'push' }, async (res) => {
      if (chrome.runtime.lastError) {
        msgEl.textContent = '❌ 无法连接页面，请刷新后重试';
        pushBtn.disabled = false;
        pushBtn.textContent = '📦 推送当前页商品到 ERP';
        return;
      }
      if (res?.success) {
        msgEl.textContent = `✓ 已推送 ${res.received} 条到 ERP，可在热销榜查看评分`;
        setStatus('推送成功', 'ok');
      } else {
        msgEl.textContent = `❌ 推送失败：${res?.error || '未知错误'}`;
        setStatus('推送失败', 'bad');
      }
      pushBtn.disabled = false;
      pushBtn.textContent = '📦 推送当前页商品到 ERP';
      refreshStoreCount();
    });
  } catch (e) {
    msgEl.textContent = `❌ ${e.message}`;
    pushBtn.disabled = false;
  }
});

batchBtn.addEventListener('click', async () => {
  batchBtn.disabled = true;
  batchBtn.textContent = '推送中...';
  msgEl.textContent = '';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'push' }, async (res) => {
      if (res?.success) {
        msgEl.textContent = `✓ 批量推送 ${res.received} 条到 ERP`;
      } else {
        msgEl.textContent = `❌ 失败：${res?.error || '未知错误'}`;
      }
      batchBtn.disabled = false;
      batchBtn.textContent = '📋 批量推送列表页商品';
      refreshStoreCount();
    });
  } catch (e) {
    msgEl.textContent = `❌ ${e.message}`;
    batchBtn.disabled = false;
  }
});

init();
