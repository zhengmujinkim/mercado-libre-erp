import { NextResponse } from 'next/server';

export interface SelectionItem {
  id: string;
  rank: number;
  name: string;
  category: 'beauty' | 'electronics' | 'pets';
  categoryLabel: string;
  categoryId: string;
  price1688: number;
  totalCost: number;
  sellUSD: number;
  netProfit: number;
  margin: number;
  competitors: number;
  score: number;
  verdict: 'hot' | 'go' | 'watch' | 'skip';
  note: string;
  status: 'pending' | 'approved' | 'listing' | 'listed' | 'rejected';
  imageUrl?: string;
}

const initialData: SelectionItem[] = [
  {id:"p01",rank:1,name:"小黄鸭宠物零食分配器",category:"pets",categoryLabel:"宠物零食",categoryId:"CBT458038",price1688:5.30,totalCost:11.30,sellUSD:8.99,netProfit:43.07,margin:66.5,competitors:40,score:95,verdict:"hot",note:"蓝海！竞品仅40个，利润空间大，轻小件运费友好",status:"pending"},
  {id:"p02",rank:2,name:"面膜碗+硅胶涂抹棒套装",category:"beauty",categoryLabel:"面部护理",categoryId:"CBT392452",price1688:2.50,totalCost:8.50,sellUSD:4.99,netProfit:19.18,margin:53,competitors:150,score:90,verdict:"hot",note:"蓝海品，DIY护肤趋势利好，竞品少利润高",status:"pending"},
  {id:"p03",rank:3,name:"猫眼美甲磁铁笔",category:"beauty",categoryLabel:"美甲工具",categoryId:"CBT29884",price1688:2.00,totalCost:8.00,sellUSD:4.99,netProfit:20.38,margin:57,competitors:200,score:90,verdict:"hot",note:"美甲细分蓝海，利润率57%，需确认品类归属",status:"pending"},
  {id:"p04",rank:4,name:"USB外置声卡",category:"electronics",categoryLabel:"声卡",categoryId:"CBT1663",price1688:3.50,totalCost:9.50,sellUSD:4.99,netProfit:20.68,margin:58,competitors:80,score:90,verdict:"hot",note:"采购价极低，体积最小，竞品仅80个",status:"pending"},
  {id:"p05",rank:5,name:"宠物冻干零食",category:"pets",categoryLabel:"宠物零食",categoryId:"CBT458038",price1688:3.00,totalCost:9.00,sellUSD:5.99,netProfit:27.23,margin:63.1,competitors:150,score:90,verdict:"watch",note:"利润率高但需MAPA食品认证，跨境门槛高",status:"pending"},
  {id:"p06",rank:6,name:"心形迷你气垫粉扑",category:"beauty",categoryLabel:"美妆蛋",categoryId:"CBT389307",price1688:1.20,totalCost:7.20,sellUSD:3.49,netProfit:17.27,margin:69,competitors:4317,score:85,verdict:"go",note:"成本最低¥1.20，利润率69%最高，适合走量",status:"pending"},
  {id:"p07",rank:7,name:"金属面霜挖勺",category:"beauty",categoryLabel:"面部护理",categoryId:"CBT392452",price1688:1.80,totalCost:7.80,sellUSD:3.99,netProfit:14.55,margin:49,competitors:500,score:85,verdict:"go",note:"跨境爆款，成本极低适合大量铺货",status:"pending"},
  {id:"p08",rank:8,name:"HDMI视频采集卡",category:"electronics",categoryLabel:"采集卡",categoryId:"CBT1659",price1688:13.00,totalCost:19.00,sellUSD:14.99,netProfit:71.66,margin:66,competitors:80,score:85,verdict:"hot",note:"利润率66%最高，单笔净利¥71.66，游戏直播刚需",status:"pending"},
  {id:"p09",rank:9,name:"便携LED折叠化妆镜",category:"beauty",categoryLabel:"化妆镜",categoryId:"CBT431591",price1688:8.50,totalCost:14.50,sellUSD:7.99,netProfit:27.85,margin:48,competitors:2000,score:80,verdict:"watch",note:"利润绝对值高，但竞品2000+需差异化",status:"pending"},
  {id:"p10",rank:10,name:"硅胶面膜刷套装",category:"beauty",categoryLabel:"面膜",categoryId:"CBT392503",price1688:3.10,totalCost:9.10,sellUSD:4.49,netProfit:14.01,margin:43,competitors:500,score:80,verdict:"go",note:"与面膜碗套装有重叠，建议二选一",status:"pending"},
  {id:"p11",rank:11,name:"一次性洗脸巾",category:"beauty",categoryLabel:"面部护理",categoryId:"CBT392452",price1688:1.71,totalCost:7.71,sellUSD:4.99,netProfit:16.82,margin:47,competitors:3000,score:80,verdict:"watch",note:"巴西本土品牌强势，铺货难度大",status:"pending"},
  {id:"p12",rank:12,name:"USB高清摄像头",category:"electronics",categoryLabel:"摄像头",categoryId:"CBT1669",price1688:18.00,totalCost:24.00,sellUSD:8.99,netProfit:30.37,margin:47,competitors:150,score:80,verdict:"go",note:"远程办公刚需，建议搭配三脚架捆绑销售",status:"pending"},
  {id:"p13",rank:13,name:"宠物指甲剪",category:"pets",categoryLabel:"宠物牵引",categoryId:"CBT370459",price1688:2.50,totalCost:8.50,sellUSD:4.99,netProfit:21.68,margin:60.3,competitors:300,score:80,verdict:"go",note:"极致轻小件，建议做套装提价到$6.99-8.99",status:"pending"},
  {id:"p14",rank:14,name:"领夹麦克风",category:"electronics",categoryLabel:"麦克风",categoryId:"CBT1667",price1688:15.00,totalCost:21.00,sellUSD:11.99,netProfit:51.52,margin:60,competitors:200,score:75,verdict:"go",note:"短视频直播风口品，建议选Type-C版本",status:"pending"},
  {id:"p15",rank:15,name:"手机三脚架支架",category:"electronics",categoryLabel:"运动相机",categoryId:"CBT392132",price1688:5.50,totalCost:11.50,sellUSD:7.99,netProfit:36.82,margin:64,competitors:300,score:75,verdict:"go",note:"可与摄像头/麦克风组合捆绑提升转化",status:"pending"},
  {id:"p16",rank:16,name:"宠物牵引绳(可伸缩)",category:"pets",categoryLabel:"宠物牵引",categoryId:"CBT370459",price1688:6.84,totalCost:12.84,sellUSD:6.99,netProfit:29.44,margin:58.5,competitors:500,score:75,verdict:"watch",note:"红海刚需，建议走差异化款(LED/花色)",status:"pending"},
  {id:"p17",rank:17,name:"旅行分装瓶套装",category:"beauty",categoryLabel:"化妆包",categoryId:"CBT389336",price1688:4.50,totalCost:10.50,sellUSD:5.99,netProfit:20.20,margin:47,competitors:10000,score:70,verdict:"skip",note:"10000+竞品红海，需差异化包装/颜色",status:"pending"},
  {id:"p18",rank:18,name:"运动相机配件套装",category:"electronics",categoryLabel:"运动相机",categoryId:"CBT392132",price1688:42.00,totalCost:48.00,sellUSD:34.99,netProfit:163.62,margin:65,competitors:150,score:70,verdict:"watch",note:"单笔利润最大¥163，但体积大物流成本高",status:"pending"},
  {id:"p19",rank:19,name:"迷你运动相机",category:"electronics",categoryLabel:"运动相机",categoryId:"CBT392132",price1688:95.00,totalCost:101.00,sellUSD:29.99,netProfit:80.38,margin:37,competitors:80,score:70,verdict:"skip",note:"品牌竞争激烈(GoPro/SJCAM)，利润率偏低",status:"pending"},
  {id:"p20",rank:20,name:"宠物自动饮水器",category:"pets",categoryLabel:"宠物零食",categoryId:"CBT458038",price1688:12.00,totalCost:18.00,sellUSD:12.99,netProfit:60.57,margin:64.8,competitors:250,score:65,verdict:"skip",note:"体积偏大物流贵，实际运费可能超¥6",status:"pending"},
];

// In-memory store (will be replaced with file-based persistence)
let selectionPool: SelectionItem[] = [...initialData];

export async function GET() {
  return NextResponse.json({
    items: selectionPool,
    stats: {
      total: selectionPool.length,
      pending: selectionPool.filter(i => i.status === 'pending').length,
      approved: selectionPool.filter(i => i.status === 'approved').length,
      listed: selectionPool.filter(i => i.status === 'listed').length,
      avgMargin: selectionPool.reduce((s, i) => s + i.margin, 0) / selectionPool.length,
      minCost: Math.min(...selectionPool.map(i => i.totalCost)),
      maxProfit: Math.max(...selectionPool.map(i => i.netProfit)),
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ids, status } = body;

    if (action === 'update_status' && ids && status) {
      selectionPool = selectionPool.map(item =>
        ids.includes(item.id) ? { ...item, status } : item
      );
      return NextResponse.json({ success: true, updated: ids.length });
    }

    if (action === 'reset') {
      selectionPool = [...initialData];
      return NextResponse.json({ success: true, message: '已重置选品池' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
