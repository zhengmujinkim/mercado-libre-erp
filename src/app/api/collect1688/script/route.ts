/**
 * 生成给云手机地址栏执行的一键采集 javascript: 脚本
 *
 * GET /api/collect1688/script?productId=p01&secret=xxx
 *
 * 返回 { script: "javascript:(function(){...})();" }
 * 脚本逻辑：提取页面全部 alicdn 产品图 → POST 到 receive 端点 → 标题显示结果。
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId') || '';
  const secret = req.nextUrl.searchParams.get('secret') || '';

  // 自动推导当前部署 origin
  const host = req.headers.get('host') || 'mercado-libre-erp.vercel.app';
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const endpoint = `${proto}://${host}/api/collect1688/receive`;

  // 注意：地址栏执行时页面在 detail.1688.com，跨域 POST 用 no-cors；
  // 但 no-cors 读不到响应，所以脚本只负责发送，结果回传后在 ERP 里看。
  // 为了让操作者即时看到数量，脚本把提取数写进 document.title。
  const payload = {
    endpoint,
    productId,
    secret,
  };

  const script = `javascript:(function(){var ep=${JSON.stringify(payload.endpoint)};var pid=${JSON.stringify(
    payload.productId,
  )};var sec=${JSON.stringify(
    payload.secret,
  )};var urls=[];var imgs=document.querySelectorAll('img');for(var i=0;i<imgs.length;i++){var s=imgs[i].src||imgs[i].getAttribute('data-src')||imgs[i].getAttribute('data-ks-lazyload')||'';if(s&&s.indexOf('alicdn')>-1&&urls.indexOf(s)===-1){urls.push(s)}}var t=(document.querySelector('h1')&&document.querySelector('h1').innerText)||document.title||'';var body=JSON.stringify({productId:pid,pageUrl:location.href,title:t.trim(),images:urls,secret:sec});fetch(ep,{method:'POST',mode:'cors',headers:{'Content-Type':'application/json'},body:body}).then(function(r){return r.json()}).then(function(j){document.title='OK_'+j.downloaded+'/'+j.normalized+(j.suspect?'_SUS'+j.suspect:'')+(j.aiRan?'_AI':'')}).catch(function(){try{fetch(ep,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:body});document.title='SENT_'+urls.length}catch(e){document.title='ERR_'+e.message}});})();`;

  return NextResponse.json({
    script,
    endpoint,
    productId,
    usage:
      '云手机登录1688打开商品详情页 → 地址栏粘贴此脚本(确保javascript:前缀不被浏览器吃掉) → 回车 → 标题变 OK_下载数/总数',
  });
}
