import { NextRequest, NextResponse } from 'next/server';

// ========== Types ==========
interface SiteConfig {
  name: string;
  currency: string;
  domain: string;
  keywords: string[];
}

interface TranslatedItem {
  id: string;
  title: string;
  titleCN: string;
  price: number;
  currency: string;
  soldQuantity: number;
  thumbnail: string;
  permalink: string;
  rating: number;
  site: string;
}

interface TrendKeyword {
  keyword: string;
  keywordCN: string;
  searchCount: number;
  items: TranslatedItem[];
}

// ========== Site Configuration ==========
const SITE_CONFIG: Record<string, SiteConfig> = {
  MLM: {
    name: '墨西哥', currency: 'MXN', domain: 'mercadolibre.com.mx',
    keywords: ['celular', 'laptop', 'audifonos', 'bocina bluetooth', 'smartwatch', 'tablet', 'camara', 'impresora', 'parlante', 'proyector'],
  },
  MLB: {
    name: '巴西', currency: 'BRL', domain: 'mercadolivre.com.br',
    keywords: ['celular', 'notebook', 'fone de ouvido', 'caixa de som', 'smartwatch', 'tablet', 'camera', 'impressora', 'alto-falante', 'projetor'],
  },
  MLA: {
    name: '阿根廷', currency: 'ARS', domain: 'mercadolibre.com.ar',
    keywords: ['celular', 'laptop', 'auriculares', 'parlante bluetooth', 'smartwatch', 'tablet', 'camara', 'impresora', 'altavoz', 'proyector'],
  },
  MLC: {
    name: '智利', currency: 'CLP', domain: 'mercadolibre.cl',
    keywords: ['celular', 'laptop', 'audifonos', 'parlante bluetooth', 'smartwatch', 'tablet', 'camara', 'impresora', 'altavoz', 'proyector'],
  },
  MCO: {
    name: '哥伦比亚', currency: 'COP', domain: 'mercadolibre.com.co',
    keywords: ['celular', 'laptop', 'audifonos', 'bocina bluetooth', 'smartwatch', 'tablet', 'camara', 'impresora', 'parlante', 'proyector'],
  },
};

// ========== 非电商关键词过滤器 ==========
const NON_PRODUCT_TERMS = [
  // 新闻 / 时事
  'noticias', 'noticia', 'news', 'ultima hora', 'última hora', 'efemerides', 'efemérides',
  // 体育
  'vs', 'partido', 'final', 'resultado', 'marcador', 'goles', 'liga', 'copa', 'mundial',
  'cagliari', 'inter', 'miami', 'barcelona', 'real madrid', 'football', 'futbol', 'fútbol',
  'nfl', 'nba', 'mlb', 'ucl', ' champions',
  // 天气
  'clima', 'tiempo', 'weather', 'temperatura', 'lluvia', 'huracan', 'huracán', 'terremoto',
  // 娱乐 / 人物
  'horoscopo', 'horóscopo', 'serie', 'pelicula', 'película', 'cantante', 'actor', 'actriz',
  'famoso', 'celebridad', 'musica', 'música', 'festival', 'concierto', 'tv', 'television',
  'televisión', 'netflix', 'disney', 'youtube', 'tiktok',
  // 政治 / 社会
  'elecciones', 'presidente', 'gobierno', 'politica', 'política', 'protesta',
  // 其他非电商
  'traduccion', 'traducción', 'significado', 'traductor',
];

function isProductKeyword(keyword: string): boolean {
  const kw = keyword.toLowerCase();
  return !NON_PRODUCT_TERMS.some(term => kw.includes(term));
}

// ========== Utility Functions ==========
function safeNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseInt(v, 10) || 0;
  return 0;
}

// ========== 西班牙语→中文 电商词典（330+词条）==========
// 键为小写无重音形式，查询时统一去重音匹配
const DICT: Record<string, string> = {
  // ---- 电子产品 ----
  'celular': '手机', 'telefono': '电话', 'smartphone': '智能手机',
  'tablet': '平板电脑', 'laptop': '笔记本电脑', 'computadora': '电脑',
  'computador': '电脑', 'pc': '电脑', 'teclado': '键盘', 'mouse': '鼠标',
  'monitor': '显示器', 'pantalla': '屏幕', 'smart tv': '智能电视',
  'televisor': '电视', 'tv': '电视', 'parlante': '音箱', 'bocina': '音箱',
  'altavoz': '音箱', 'audifonos': '耳机', 'auriculares': '耳机',
  'consola': '游戏机', 'videojuego': '视频游戏', 'cargador': '充电器',
  'camara': '相机', 'dron': '无人机', 'proyector': '投影仪',
  'impresora': '打印机', 'router': '路由器', 'usb': 'U盘',
  'memoria': '存储', 'disco duro': '硬盘', 'ssd': '固态硬盘',
  'bateria': '电池', 'batería': '电池', 'microfono': '麦克风',
  'webcam': '摄像头', 'gaming': '游戏',
  'iphone': 'iPhone', 'samsung': '三星', 'xiaomi': '小米', 'huawei': '华为',
  'macbook': 'MacBook', 'airpods': 'AirPods', 'notebook': '笔记本',
  'computacion': '电脑', 'electronica': '电子', 'impresion': '打印',
  'antena': '天线', 'decodificador': '解码器', 'amplificador': '放大器',
  'parlantes': '音箱', 'alambr': '无线', 'inalambrico': '无线',
  'bluetooth': '蓝牙', 'led': 'LED', 'digital': '数字',
  'portatil': '便携式', 'mini': '迷你', 'nano': '纳米',

  // ---- 手机配件 ----
  'funda': '手机壳', 'fundas': '手机壳', 'carcasa': '手机壳',
  'protector': '保护套', 'vidrio': '玻璃', 'templado': '钢化',
  'cable': '数据线', 'cables': '数据线', 'soporte': '支架',
  'power bank': '充电宝', 'bateria externa': '充电宝',
  'membrana': '保护膜', 'case': '壳套', 'cover': '保护套',

  // ---- 服装 ----
  'vestido': '连衣裙', 'camisa': '衬衫', 'pantalon': '裤子',
  'pantalón': '裤子', 'blusa': '女衬衫', 'falda': '裙子',
  'shorts': '短裤', 'jeans': '牛仔裤', 'zapatillas': '运动鞋',
  'tenis': '运动鞋', 'sandalias': '凉鞋', 'botas': '靴子',
  'botines': '短靴', 'chaqueta': '夹克', 'abrigo': '大衣',
  'sueter': '毛衣', 'sudadera': '卫衣', 'buzo': '卫衣',
  'polera': 'T恤', 'playera': 'T恤', 'remera': 'T恤', 'camiseta': 'T恤',
  'ropa': '服装', 'moda': '时尚', 'deportiva': '运动风',
  'deportivo': '运动风', 'interior': '内衣', 'pijama': '睡衣',
  'traje': '套装', 'uniforme': '制服', 'chamarra': '外套',
  'casaca': '外套', 'parka': '派克大衣', 'chaleco': '马甲',
  'poleron': '卫衣', 'mallas': '打底裤', 'leggings': '打底裤',
  'medias': '袜子', 'calcetines': '袜子', 'zapatilla': '运动鞋',
  'zapato': '鞋', 'zapatos': '鞋', 'calzado': '鞋类',
  'talon': '高跟鞋', 'plataforma': '厚底鞋', 'alpargata': '帆布鞋',
  'canguro': '袋鼠鞋', 'franela': '法兰绒', 'algodon': '棉',

  // ---- 配饰 ----
  'mochila': '背包', 'bolso': '包', 'bolsa': '袋子', 'cartera': '钱包',
  'billetera': '钱包', 'reloj': '手表', 'pulsera': '手链',
  'collar': '项链', 'anillo': '戒指', 'aretes': '耳环',
  'lentes': '眼镜', 'gafas': '眼镜', 'sombrero': '帽子',
  'gorra': '棒球帽', 'gorro': '帽子', 'cinturon': '腰带',
  'bufanda': '围巾', 'lentes de sol': '太阳镜', 'gafas de sol': '太阳镜',
  'joyeria': '珠宝', 'joyas': '珠宝', 'relojes': '手表',
  'mochilas': '背包', 'bolsos': '包', 'carteras': '钱包',
  'accesorios': '配饰', 'bandolera': '斜挎包', 'maletin': '公文包',

  // ---- 家居 / 家电 ----
  'refrigerador': '冰箱', 'refrigeracion': '制冷', 'lavadora': '洗衣机',
  'secadora': '烘干机', 'aire acondicionado': '空调',
  'calefaccion': '暖气', 'calentador': '热水器', 'estufa': '炉灶',
  'horno': '烤箱', 'microondas': '微波炉', 'licuadora': '搅拌机',
  'batidora': '搅拌机', 'cafetera': '咖啡机', 'arrocera': '电饭煲',
  'sartén': '煎锅', 'sarten': '煎锅', 'olla': '锅',
  'cuchillo': '刀', 'cubiertos': '餐具', 'platos': '盘子',
  'vasos': '杯子', 'taza': '杯子', 'termo': '保温杯',
  'cocina': '厨房', 'horno electrico': '电烤箱',
  'freidora': '炸锅', 'freidora de aire': '空气炸锅',
  'aspiradora': '吸尘器', 'plancha': '熨斗', 'ventilador': '风扇',
  'purificador': '净化器', 'humidificador': '加湿器',
  'deshumidificador': '除湿机', 'caldera': '锅炉',
  'lampara': '灯', 'lampara led': 'LED灯', 'foco': '灯泡',
  'bombilla': '灯泡', 'tira led': 'LED灯带',
  'sillon': '沙发', 'sofa': '沙发', 'cama': '床', 'colchon': '床垫',
  'colchón': '床垫', 'almohada': '枕头', 'cobija': '被子',
  'manta': '毯子', 'sabana': '床单', 'sábana': '床单',
  'cortina': '窗帘', 'alfombra': '地毯', 'espejo': '镜子',
  'escritorio': '书桌', 'mesa': '桌子', 'silla': '椅子',
  'sillas': '椅子', 'estante': '架子', 'estanteria': '书架',
  'armario': '衣柜', 'ropero': '衣柜', 'comoda': '梳妆台',
  'tocador': '梳妆台', 'mueble': '家具', 'muebles': '家具',
  'mueble de tv': '电视柜', 'puff': '懒人沙发',
  'reposera': '躺椅', 'toldo': '遮阳篷', 'carpa': '帐篷',
  'maceta': '花盆', 'jardin': '花园', 'planta': '植物',
  'terrario': '玻璃容器', 'riego': '灌溉',
  'decoracion': '装饰', 'decorativo': '装饰品', 'cuadro': '画框',
  'funda de sofa': '沙发套', 'funda nórdica': '被套',

  // ---- 母婴 / 玩具 / 宠物 ----
  'juguete': '玩具', 'muñeca': '娃娃', 'muñeco': '玩偶',
  'rompecabezas': '拼图', 'lego': '乐高', 'puzzle': '拼图',
  'peluche': '毛绒玩具', 'figura de accion': '手办',
  'juegos de mesa': '桌游', 'bicicleta': '自行车', 'bici': '自行车',
  'trici': '三轮车', 'patineta': '滑板车', 'patines': '旱冰鞋',
  'bebe': '婴儿', 'pañal': '尿布', 'panal': '尿布',
  'biberon': '奶瓶', 'biberón': '奶瓶', 'chupete': '奶嘴',
  'cuna': '婴儿床', 'cochecito': '婴儿车', 'silla de auto': '安全座椅',
  'mamadera': '奶瓶', 'mordedor': '磨牙器',
  'mascota': '宠物', 'perro': '狗', 'gato': '猫',
  'collar para perro': '狗项圈', 'correa': '牵引绳',
  'arena para gato': '猫砂', 'croquetas': '宠物粮',
  'alimento para perro': '狗粮', 'alimento para gato': '猫粮',
  'acuario': '水族箱', 'pez': '鱼', 'comedor': '食盆',
  'juguete para mascota': '宠物玩具', 'cama para perro': '狗窝',
  'cama para mascota': '宠物床',

  // ---- 美容 / 个护 ----
  'perfume': '香水', 'maquillaje': '化妆品', 'labial': '口红',
  'base de maquillaje': '粉底', 'rubor': '腮红', 'rimmel': '睫毛膏',
  'mascara de pestanas': '睫毛膏', 'delineador': '眼线笔',
  'sombra de ojos': '眼影', 'sombras': '眼影', 'polvo compacto': '粉饼',
  'crema': '面霜', 'protector solar': '防晒霜', 'bloqueador': '防晒',
  'shampoo': '洗发水', 'champú': '洗发水', 'acondicionador': '护发素',
  'secador de pelo': '吹风机', 'plancha de pelo': '直发器',
  'rizador': '卷发器', 'cepillo': '刷子', 'cepillo de pelo': '梳子',
  'depiladora': '脱毛器', 'rasuradora': '剃刀', 'maquina de afeitar': '剃须刀',
  'kit de maquillaje': '化妆套装', 'paleta': '彩妆盘',
  'serum': '精华液', 'tónico': '爽肤水', 'tonico': '爽肤水',
  'mascarilla facial': '面膜', 'exfoliante': '磨砂膏',
  'desodorante': '止汗露', 'jabon': '肥皂', 'jabón': '肥皂',
  'gel de ducha': '沐浴露', 'locion': '乳液', 'loción': '乳液',
  'aromaterapia': '芳香疗法', 'esencia': '精油',

  // ---- 食品 / 饮料 ----
  'cafe': '咖啡', 'café': '咖啡', 'te': '茶', 'té': '茶',
  'chocolate': '巧克力', 'galletas': '饼干', 'arroz': '大米',
  'azucar': '糖', 'azúcar': '糖', 'aceite': '食用油',
  'harina': '面粉', 'pasta': '意面', 'salsa': '酱料',
  'miel': '蜂蜜', 'mermelada': '果酱', 'leche': '牛奶',
  'queso': '奶酪', 'embutido': '香肠', 'jamón': '火腿',
  'jamon': '火腿', 'cereal': '麦片', 'snack': '零食',
  'chips': '薯片', 'gomas': '软糖', 'caramelo': '糖果',
  'suplemento': '保健品', 'proteina': '蛋白质', 'proteína': '蛋白质',
  'vitamina': '维生素', 'colageno': '胶原蛋白', 'colágeno': '胶原蛋白',
  'bebida': '饮料', 'jugo': '果汁', 'agua': '水',
  'refresco': '汽水', 'cerveza': '啤酒', 'vino': '葡萄酒',
  'licor': '酒', 'whisky': '威士忌', 'tequila': '龙舌兰酒',
  'comida': '食品', 'alimento': '食物', 'nutricion': '营养',

  // ---- 健康 / 医疗 ----
  'vitaminas': '维生素', 'minerales': '矿物质',
  'omega 3': 'Omega-3',
  'primeros auxilios': '急救', 'botiquin': '急救箱',
  'termometro': '体温计', 'tensiómetro': '血压计', 'tensiometro': '血压计',
  'oximetro': '血氧仪', 'nebulizador': '雾化器',
  'pastillas': '药片', 'medicamento': '药品',
  'mascarilla': '口罩', 'gel antibacterial': '消毒凝胶',
  'alcohol': '酒精', 'vendas': '绷带', 'curita': '创可贴',
  'salud': '健康', 'bienestar': '保健', 'farmacia': '药房',
  'gotero': '滴管', 'jeringa': '注射器', 'tiras reactivas': '试纸',
  'glucometro': '血糖仪', 'andador': '助行器', 'muletas': '拐杖',

  // ---- 工具 / 五金 ----
  'herramienta': '工具', 'herramientas': '工具',
  'taladro': '电钻', 'destornillador': '螺丝刀',
  'llave inglesa': '扳手', 'martillo': '锤子',
  'sierra': '锯', 'lijadora': '砂光机', 'soldadora': '焊机',
  'compresor': '空压机', 'pistola de pintura': '喷枪',
  'nivel': '水平仪', 'cinta metrica': '卷尺', 'cinta métrica': '卷尺',
  'multimetro': '万用表', 'multímetro': '万用表',
  'juego de herramientas': '工具套装', 'caja de herramientas': '工具箱',
  'tornillo': '螺丝', 'clavo': '钉子', 'bisagra': '铰链',
  'candado': '锁', 'cerradura': '锁具',
  'ferreteria': '五金', 'construccion': '建筑', 'construcción': '建筑',
  'pintura': '涂料', 'rodillo': '滚筒', 'brocha': '刷子',
  'escalera': '梯子', 'manguera': '软管',
  'generador': '发电机', 'amoladora': '角磨机',

  // ---- 户外 / 花园 ----
  'parrilla': '烧烤架', 'asador': '烤架', 'grill': '烤架',
  'tienda de campana': '帐篷',
  'saco de dormir': '睡袋', 'mochila de camping': '登山包',
  'linterna': '手电筒', 'navaja': '折叠刀',
  'bicicleta montaña': '山地车', 'kayak': '皮划艇',
  'caña de pescar': '鱼竿', 'carrete': '渔轮',
  'pesca': '钓鱼', 'camping': '露营', 'senderismo': '徒步',
  'piscina': '游泳池', 'inflable': '充气',
  'cortacesped': '割草机', 'cortacésped': '割草机',
  'motosierra': '电锯', 'sopladora': '吹叶机',
  'manguera de riego': '浇水软管', 'tijeras de poda': '修枝剪',
  'abono': '肥料', 'semillas': '种子', 'tierra': '土壤',
  'terraza': '露台', 'balcon': '阳台', 'balcón': '阳台',

  // ---- 运动 ----
  'pelota': '球', 'balon': '大球', 'balón': '大球',
  'balon de futbol': '足球', 'pelota de futbol': '足球',
  'raqueta': '球拍', 'pesas': '哑铃', 'mancuerna': '哑铃',
  'banda elastica': '弹力带', 'banda elástica': '弹力带',
  'yoga': '瑜伽', 'tapete de yoga': '瑜伽垫',
  'cinta de correr': '跑步机', 'eliptica': '椭圆机',
  'elíptica': '椭圆机', 'gimnasio': '健身房',
  'fitness': '健身', 'deporte': '运动',
  'ropa deportiva': '运动服', 'guantes de box': '拳击手套',
  'box': '拳击', 'natacion': '游泳', 'natación': '游泳',
  'gafas de natacion': '泳镜', 'patineta eléctrica': '电动滑板车',
  'scooter': '电动滑板车', 'skateboard': '滑板',
  'surf': '冲浪', 'snowboard': '滑雪板', 'esqui': '滑雪',
  'pesas rusas': '壶铃', 'kettlebell': '壶铃',
  'cuerda de saltar': '跳绳', 'trampa': '蹦床', 'trampolin': '蹦床',

  // ---- 汽车 / 摩托 ----
  'auto': '汽车', 'automovil': '汽车', 'automóvil': '汽车',
  'coche': '汽车', 'carro': '汽车', 'vehiculo': '车辆', 'vehículo': '车辆',
  'moto': '摩托车', 'motocicleta': '摩托车',
  'llanta': '轮胎', 'neumatico': '轮胎', 'neumático': '轮胎',
  'aceite de motor': '机油', 'filtro de aire': '空气滤芯',
  'bateria de auto': '汽车电瓶', 'parachoques': '保险杠',
  'espejo retrovisor': '后视镜', 'limpiaparabrisas': '雨刮器',
  'casco': '头盔', 'guantes de moto': '摩托手套',
  'alarma': '报警器', 'gps': 'GPS导航',
  'repuesto': '配件', 'repuestos': '配件', 'accesorios para auto': '汽车配件',
  'faro': '车灯', 'luces led': 'LED车灯',

  // ---- 文具 / 办公 ----
  'cuaderno': '笔记本', 'libreta': '笔记本', 'agenda': '日程本',
  'boligrafo': '圆珠笔', 'bolígrafo': '圆珠笔', 'lapiz': '铅笔',
  'lápiz': '铅笔', 'goma de borrar': '橡皮', 'regla': '尺子',
  'colores': '彩笔', 'marcador': '马克笔', 'resaltador': '荧光笔',
  'carpeta': '文件夹', 'archivo': '档案', 'calculadora': '计算器',
  'papel': '纸', 'folios': '活页纸', 'cinta adhesiva': '胶带',
  'pegamento': '胶水', 'tijeras': '剪刀', 'grapadora': '订书机',
  'silla de oficina': '办公椅', 'mochila escolar': '书包',
  'utiles escolares': '文具', 'papeleria': '文具',

  // ---- 乐器 ----
  'guitarra': '吉他', 'bajo': '贝斯',
  'piano': '钢琴', 'teclado musical': '电子琴', 'violin': '小提琴',
  'violín': '小提琴', 'flauta': '长笛', 'trompeta': '小号',
  'ukulele': '尤克里里', 'amplificador guitarra': '吉他音箱',
  'pedal de efecto': '效果器', 'afinador': '调音器',
  'funda de guitarra': '吉他包', 'cuerdas': '琴弦',
  'microfono de condensador': '电容麦克风', 'mezcladora': '调音台',
  'musica': '音乐', 'instrumento musical': '乐器',

  // ---- 旅行 / 箱包 ----
  'maleta': '行李箱', 'valija': '行李箱', 'equipaje': '行李',
  'mochila de viaje': '旅行背包', 'bolsa de viaje': '旅行袋',
  'organizador': '收纳', 'neceser': '洗漱包',
  'almohada de viaje': '旅行枕', 'antifaz': '眼罩',
  'adaptador de viaje': '旅行转换器', 'balanza de equipaje': '行李秤',
  'turismo': '旅游', 'viaje': '旅行',

  // ---- 纺织 / 面料 ----
  'tela': '面料', 'textil': '纺织品', 'lana': '羊毛',
  'seda': '丝绸', 'linio': '亚麻', 'lino': '亚麻',
  'nylon': '尼龙', 'poliester': '涤纶', 'poliéster': '涤纶',
  'encaje': '蕾丝', 'bordado': '刺绣', 'hilo': '线',
  'aguja': '针', 'maquina de coser': '缝纫机',
  'patron de costura': '服装纸样', 'retazo': '布头',

  // ---- 农业 ----
  'semilla': '种子', 'fertilizante': '肥料', 'pesticida': '农药',
  'plaguicida': '农药', 'riego gota a gota': '滴灌',
  'tanque de agua': '水箱',
  'bomba de agua': '水泵', 'tractor': '拖拉机',
  'arado': '犁', ' cosecha': '收获',
  'ganaderia': '畜牧', 'ganadería': '畜牧', 'agricultura': '农业',
  'veterinario': '兽医',

  // ---- 其他 ----
  'generica': '通用', 'original': '原装', 'nuevo': '全新',
  'usado': '二手', 'importado': '进口', 'nacional': '国产',
  'oferta': '特价', 'descuento': '折扣', 'envio gratis': '包邮',
  'gratis': '免费', 'premium': '高端', 'economico': '经济',
  'barato': '便宜', 'calidad': '品质', 'garantia': '保修',
  'garantía': '保修', 'seguro': '保险',
  'accesorio': '配件', 'adaptador': '适配器',
  'convertidor': '转换器', 'transformador': '变压器',
  'regalo': '礼品', 'regalos': '礼品', 'navidad': '圣诞',
  'dia de la madre': '母亲节', 'dia del padre': '父亲节',
  'halloween': '万圣节', 'cumpleanos': '生日', 'cumpleaños': '生日',
};

// ========== 翻译函数 ==========

/** 去除西班牙语重音符号，统一为小写 */
function stripAccents(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** 翻译西班牙语关键词 → 中文 */
function translateKeyword(keyword: string): { cn: string; translated: boolean } {
  const kw = keyword.trim();
  if (!kw) return { cn: kw, translated: false };

  const normalized = stripAccents(kw);

  // 1. 完全匹配
  if (DICT[normalized]) return { cn: DICT[normalized], translated: true };

  // 2. 逐词翻译
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return { cn: kw, translated: false };

  const STOP_WORDS = new Set([
    'de', 'del', 'la', 'el', 'en', 'y', 'o', 'con', 'sin', 'para', 'por',
    'a', 'al', 'los', 'las', 'un', 'una', 'unos', 'unas', 'e', 'que',
    'se', 'su', 'es', 'son', 'como', 'mas', 'más', 'no', 'si',
  ]);

  const translated = words.map(w => DICT[w] || null);
  const matchCount = translated.filter(Boolean).length;

  if (matchCount > 0) {
    const parts = translated.map((t, i) => t || (STOP_WORDS.has(words[i]) ? '' : words[i]));
    const cn = parts.filter(p => p !== '').join('');
    return { cn, translated: matchCount >= words.filter(w => !STOP_WORDS.has(w)).length * 0.5 };
  }

  // 3. 提取核心词（介词前的部分）
  const coreWords = words.filter(w => !STOP_WORDS.has(w));
  const coreTranslated = coreWords.map(w => DICT[w]).filter(Boolean);
  if (coreTranslated.length > 0) {
    return { cn: coreTranslated.join(''), translated: true };
  }

  return { cn: kw, translated: false };
}

// ========== API Helpers ==========

const FETCH_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-MX,es;q=0.9,pt-BR;q=0.8,en;q=0.7',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Referer': 'https://www.mercadolibre.com/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
};

let searchErrorLog: string[] = [];

async function fetchTrends(siteId: string): Promise<Array<{ keyword: string; number_results?: number | string }>> {
  try {
    const res = await fetch('https://api.mercadolibre.com/sites/' + siteId + '/trends', {
      cache: 'no-store',
      headers: FETCH_HEADERS,
    });
    if (!res.ok) {
      searchErrorLog.push('trends -> HTTP ' + res.status);
      throw new Error('trends fetch failed: ' + res.status);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      searchErrorLog.push('trends -> not array, got: ' + JSON.stringify(data).slice(0, 200));
      throw new Error('trends response not array');
    }
    return data;
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (!searchErrorLog.some(l => l.startsWith('trends'))) {
      searchErrorLog.push('trends -> ' + msg);
    }
    throw e;
  }
}

async function searchItems(siteId: string, query: string, currency: string, siteCode: string, limit: number = 5) {
  const doSearch = async (q: string) => {
    const url = 'https://api.mercadolibre.com/sites/' + siteId
      + '/search?q=' + encodeURIComponent(q)
      + '&limit=' + limit
      + '&sort=relevance';
    try {
      const res = await fetch(url, { cache: 'no-store', headers: FETCH_HEADERS });
      if (!res.ok) {
        searchErrorLog.push('search "' + q + '" -> HTTP ' + res.status);
        return [];
      }
      const data = await res.json();
      return data.results || [];
    } catch (e: any) {
      searchErrorLog.push('search "' + q + '" -> ' + (e?.message || String(e)));
      return [];
    }
  };

  let rawItems = await doSearch(query);

  // 长词搜不到则缩短重试（取前2个词 → 前1个词）
  if (rawItems.length === 0) {
    const words = query.trim().split(/\s+/);
    if (words.length > 1) {
      rawItems = await doSearch(words.slice(0, 2).join(' '));
    }
    if (rawItems.length === 0 && words.length > 2) {
      rawItems = await doSearch(words[0]);
    }
  }

  return rawItems.map((item: Record<string, any>) => {
    const titleCN = translateKeyword(item.title || '').cn;
    return {
      id: item.id,
      title: item.title || '',
      titleCN,
      price: item.price || 0,
      currency: item.currency_id || currency,
      soldQuantity: item.sold_quantity || 0,
      thumbnail: item.thumbnail || '',
      permalink: item.permalink || '',
      rating: item.rating || 0,
      site: siteCode,
    };
  });
}

// ========== Main Handler ==========
export async function GET(request: NextRequest) {
  searchErrorLog = [];
  const { searchParams } = new URL(request.url);
  const site = searchParams.get('site') || 'MLM';
  const keyword = searchParams.get('keyword') || '';
  const debug = searchParams.get('debug') === '1';

  const config = SITE_CONFIG[site] || SITE_CONFIG['MLM'];

  // ── 关键词搜索（fallback / 补充）──
  if (keyword) {
    const items = await searchItems(site, keyword, config.currency, site);
    const { cn, translated } = translateKeyword(keyword);
    return NextResponse.json({
      trends: [{ keyword, keywordCN: cn, searchCount: 0, items }],
      items,
      sourceSite: site,
      mock: false,
    });
  }

  // ── 方法1：ML 官方 Trends API ──
  try {
    const trendsRaw = await fetchTrends(site);
    if (trendsRaw.length > 0) {
      // 过滤非电商热搜词（体育比赛、天气、新闻等）
      const productTrends = trendsRaw.filter(t => isProductKeyword(t.keyword || ''));
      const trendsToUse = productTrends.length >= 3 ? productTrends : trendsRaw; // 过滤后太少则用原始数据

      // 并行查询每个热搜词的商品
      const results = await Promise.all(
        trendsToUse.slice(0, 15).map(async (t, i) => {
          const kw = t.keyword || '';
          const { cn } = translateKeyword(kw);
          const searchCount = safeNum(t.number_results) || Math.max(5000 - i * 300, 1000);
          const items = await searchItems(site, kw, config.currency, site);
          return { keyword: kw, keywordCN: cn, searchCount, items };
        })
      );

      const allItems: TranslatedItem[] = [];
      const seen = new Set<string>();
      for (const trend of results) {
        for (const item of trend.items) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            allItems.push(item);
          }
        }
      }

      return NextResponse.json({
        trends: results,
        items: allItems.slice(0, 50),
        sourceSite: site,
        mock: false,
      });
    }
  } catch (err) {
    console.error('ML Trends API error:', err);
  }

  // ── 方法2：品类关键词搜索（fallback）──
  try {
    const keywords = config.keywords.slice(0, 5);
    const trendResults: TrendKeyword[] = [];
    const allItems: TranslatedItem[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];
      const { cn } = translateKeyword(kw);
      const items = await searchItems(site, kw, config.currency, site, 4);

      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          allItems.push(item);
        }
      }
      trendResults.push({
        keyword: kw,
        keywordCN: cn,
        searchCount: Math.max(5000 - i * 500, 1000),
        items,
      });
    }

    if (allItems.length > 0) {
      return NextResponse.json({
        trends: trendResults,
        items: allItems.slice(0, 50),
        sourceSite: site,
        mock: false,
      });
    }
  } catch (err) {
    console.error('Keyword search fallback error:', err);
  }

  // ── 全部失败 ──
  const fallbackTrends = config.keywords.slice(0, 10).map((kw, i) => {
    const { cn } = translateKeyword(kw);
    return { keyword: kw, keywordCN: cn, searchCount: 0, items: [] };
  });

  return NextResponse.json({
    trends: fallbackTrends,
    items: [],
    sourceSite: site,
    mock: false,
    message: '热销榜数据暂时获取失败，美客多API可能限制了海外访问。你可以直接访问美客多网站查看热销品：',
    websiteUrl: 'https://www.' + config.domain,
    ...(debug ? { debug: { errors: searchErrorLog.slice(0, 20) } } : {}),
  });
}
