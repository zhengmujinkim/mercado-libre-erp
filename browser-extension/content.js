// 美客多 & 1688 数据采集
(function () {
  'use strict';

  const ERP_BASE = 'https://mercado-libre-erp.vercel.app';
  const MELI_HOSTS = [
    'mercadolibre.com', 'mercadolibre.com.mx', 'mercadolivre.com.br',
    'mercadolibre.com.ar', 'mercadolibre.cl', 'mercadolibre.com.co',
  ];

  const SITE_BY_HOST = {
    'mercadolibre.com.mx': 'MLM',
    'mercadolibre.com': 'MLM',
    'mercadolivre.com.br': 'MLB',
    'mercadolibre.com.ar': 'MLA',
    'mercadolibre.cl': 'MLC',
    'mercadolibre.com.co': 'MCO',
  };

  function getHost() { return window.location.host; }
  function isMeli() { return MELI_HOSTS.some(h => getHost().includes(h)); }
  function is1688() { return getHost().includes('1688.com'); }

  function getMeliSite() {
    return SITE_BY_HOST[getHost()] || 'MLM';
  }

  function parseSoldCount(text) {
    if (!text) return 0;
    const m = text.match(/(\d+[\d.,]*\s*(mil|k|\+)?)/i);
    if (!m) return 0;
    let n = parseFloat(m[1].replace(/[^\d.]/g, ''));
    if (/mil|k/i.test(m[2])) n *= 1000;
    return Math.round(n);
  }

  function parsePrice(text) {
    if (!text) return null;
    const m = text.match(/[\d.,]+/);
    if (!m) return null;
    return parseFloat(m[0].replace(/\./g, '').replace(',', '.'));
  }

  // ============ 美客多商品页 ============
  function scrapeMeliProduct() {
    const title =
      document.querySelector('h1.ui-pdp-title')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim() || '';
    const priceText =
      document.querySelector('.andes-money-amount__fraction')?.textContent?.trim() ||
      document.querySelector('[data-testid="price"]')?.textContent?.trim() || '';
    const price = parsePrice(priceText);
    const soldText =
      document.querySelector('.ui-pdp-color--BLUE.ui-pdp-size--XSMALL')?.textContent ||
      document.querySelector('[data-testid="sold-quantity"]')?.textContent || '';
    const seller =
      document.querySelector('.ui-pdp-color--BLACK.ui-pdp-size--XSMALL')?.textContent?.trim() ||
      document.querySelector('.seller-info__data')?.textContent?.trim() || '';
    const img =
      document.querySelector('.ui-pdp-image--1fZpa')?.getAttribute('src') ||
      document.querySelector('img.ui-pdp-image')?.getAttribute('src') || '';

    // 结构化数据
    let rating = null, reviews = 0;
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd.textContent);
        if (data.aggregateRating) {
          rating = data.aggregateRating.ratingValue;
          reviews = data.aggregateRating.reviewCount || 0;
        }
      } catch {}
    }

    const itemId =
      (window.location.pathname.match(/MLM\d+|MLB\d+|MLA\d+|MLC\d+|MCO\d+/) || [])[0] ||
      new URLSearchParams(window.location.search).get('p') || '';

    return {
      source: 'meli',
      site: getMeliSite(),
      id: itemId || `meli-${Date.now()}`,
      title,
      price,
      currency: getMeliSite() === 'MLB' ? 'BRL' : 'MXN',
      soldCount: parseSoldCount(soldText),
      rating,
      reviews,
      seller,
      url: window.location.href,
      imageUrl: img,
    };
  }

  // ============ 美客多列表页 ============
  function scrapeMeliList() {
    const items = document.querySelectorAll('.ui-search-layout__item, .ui-search-result__group');
    const products = [];
    items.forEach(el => {
      const t = el.querySelector('.ui-search-item__title, .ui-search-link__title-card')?.textContent?.trim();
      const pText = el.querySelector('.andes-money-amount__fraction')?.textContent?.trim();
      const link = el.querySelector('a.ui-search-link, a.ui-search-item__group__element')?.href;
      const img = el.querySelector('.ui-search-result-image__element')?.getAttribute('src') || '';
      const soldText = el.querySelector('.ui-search-item__group__element--sold-quantity, .ui-search-offer__sold-quantity')?.textContent || '';
      if (t) {
        products.push({
          source: 'meli',
          site: getMeliSite(),
          id: (link?.match(/MLM\d+|MLB\d+|MLA\d+|MLC\d+|MCO\d+/) || [])[0] || `meli-list-${Date.now()}-${Math.random()}`,
          title: t,
          price: parsePrice(pText),
          currency: getMeliSite() === 'MLB' ? 'BRL' : 'MXN',
          soldCount: parseSoldCount(soldText),
          url: link || window.location.href,
          imageUrl: img,
        });
      }
    });
    return products;
  }

  // ============ 1688 商品页 ============
  function scrape1688Product() {
    const title =
      document.querySelector('.d-title')?.textContent?.trim() ||
      document.querySelector('title')?.textContent?.replace(/-.*$/, '').trim() || '';

    const priceText =
      document.querySelector('.d-content.price .d-price-text span')?.textContent ||
      document.querySelector('[class*="PriceText"]')?.textContent || '';
    const price = parsePrice(priceText);

    const moq =
      document.querySelector('.d-content.count .d-price-text')?.textContent?.trim() ||
      document.querySelector('[class*="MoqText"]')?.textContent?.trim() || '';

    const shopName =
      document.querySelector('.company-name')?.textContent?.trim() ||
      document.querySelector('[class*="CompanyName"]')?.textContent?.trim() || '';

    const img =
      document.querySelector('.detail-gallery-img img')?.getAttribute('src') ||
      document.querySelector('.main-image img')?.getAttribute('src') || '';

    const offerId =
      (window.location.pathname.match(/\d+/) || [])[0] || '';

    return {
      source: '1688',
      id: offerId || `1688-${Date.now()}`,
      title,
      price,
      priceRange: priceText?.trim(),
      currency: 'CNY',
      soldCount: 0,
      moq,
      seller: shopName,
      url: window.location.href,
      imageUrl: img,
    };
  }

  // ============ 推送到 ERP ============
  async function pushToERP(items) {
    const arr = Array.isArray(items) ? items : [items];
    try {
      const res = await fetch(`${ERP_BASE}/api/browser-extension`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arr),
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.error('Push failed:', e);
      return { success: false, error: String(e) };
    }
  }

  // ============ 消息处理 ============
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === 'scrape') {
      let data;
      if (isMeli()) {
        if (window.location.pathname.includes('-M') || window.location.pathname.match(/MLM|MLB|MLA|MLC|MCO/)) {
          data = scrapeMeliProduct();
          data._type = 'product';
        } else {
          const list = scrapeMeliList();
          data = { _type: 'list', products: list };
        }
      } else if (is1688()) {
        data = scrape1688Product();
        data._type = 'product';
      } else {
        data = { _type: 'error', message: '不支持的站点' };
      }
      sendResponse(data);
      return true;
    }

    if (req.action === 'push') {
      let data;
      if (isMeli()) {
        const isProductPage = window.location.pathname.match(/MLM|MLB|MLA|MLC|MCO/) ||
                              window.location.pathname.includes('-M');
        data = isProductPage ? [scrapeMeliProduct()] : scrapeMeliList();
      } else if (is1688()) {
        data = [scrape1688Product()];
      } else {
        sendResponse({ success: false, error: '不支持的站点' });
        return true;
      }
      pushToERP(data).then(r => sendResponse(r));
      return true;
    }
  });

  // 注入悬浮按钮（在商品详情页右下角）
  function injectFloatButton() {
    if (document.getElementById('meli-erp-float')) return;
    const btn = document.createElement('div');
    btn.id = 'meli-erp-float';
    btn.innerHTML = '📊';
    btn.title = '推送到美客多 ERP';
    btn.style.cssText = `
      position: fixed; right: 20px; bottom: 20px; z-index: 99999;
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, #3483fa, #2968c8);
      color: white; font-size: 24px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s;
    `;
    btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseleave = () => btn.style.transform = 'scale(1)';
    btn.onclick = async () => {
      btn.innerHTML = '⏳';
      chrome.runtime.sendMessage({ action: 'push' }, (res) => {
        if (res?.success) {
          btn.innerHTML = '✅';
          setTimeout(() => { btn.innerHTML = '📊'; }, 1500);
        } else {
          btn.innerHTML = '❌';
          setTimeout(() => { btn.innerHTML = '📊'; }, 1500);
        }
      });
    };
    document.body.appendChild(btn);
  }

  // 在支持的站点上自动注入按钮
  if (isMeli() || is1688()) {
    if (document.readyState === 'complete') {
      injectFloatButton();
    } else {
      window.addEventListener('load', injectFloatButton);
    }
  }
})();
