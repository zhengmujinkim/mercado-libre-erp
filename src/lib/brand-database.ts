// 全球知名品牌数据库 - 侵权风险检测用
// 覆盖时尚、电子、食品、玩具、运动、汽车、美妆、家居、娱乐、科技等主要品类

export interface BrandEntry {
  /** 品牌显示名（可能含中文） */
  name: string;
  /** 英文名（用于模糊匹配） */
  englishName: string;
  /** 品类 */
  category: string;
  /** 风险等级: high=直接侵权 | medium=需注意 | low=低风险 */
  riskLevel: 'high' | 'medium' | 'low';
  /** 别名/变体（含葡语、中文等） */
  aliases?: string[];
  /** 备注 */
  notes?: string;
}

export interface BrandCategory {
  category: string;
  brands: BrandEntry[];
}

// ============================================================
// 品牌数据库 - 按品类分组
// ============================================================

export const BRAND_DATABASE: BrandCategory[] = [
  // ──────────── 运动与鞋服 ────────────
  {
    category: '运动与鞋服',
    brands: [
      { name: '耐克', englishName: 'Nike', category: '运动与鞋服', riskLevel: 'high', aliases: ['NIKE', 'Nike Air', 'Air Jordan', 'Jordan', 'Just Do It'], notes: '全球第一运动品牌' },
      { name: '阿迪达斯', englishName: 'Adidas', category: '运动与鞋服', riskLevel: 'high', aliases: ['adidas', 'Adidas Originals', 'Three Stripes'], notes: '三条纹标志' },
      { name: '彪马', englishName: 'Puma', category: '运动与鞋服', riskLevel: 'high', aliases: ['PUMA'], notes: '' },
      { name: '新百伦', englishName: 'New Balance', category: '运动与鞋服', riskLevel: 'high', aliases: ['NB', 'NewBalance'], notes: '' },
      { name: '锐步', englishName: 'Reebok', category: '运动与鞋服', riskLevel: 'medium', aliases: ['REEBOK'], notes: '' },
      { name: '匡威', englishName: 'Converse', category: '运动与鞋服', riskLevel: 'high', aliases: ['All Star', 'Chuck Taylor'], notes: 'Nike旗下' },
      { name: '范斯', englishName: 'Vans', category: '运动与鞋服', riskLevel: 'high', aliases: ['VANS', 'Old Skool'], notes: '' },
      { name: '北面', englishName: 'The North Face', category: '运动与鞋服', riskLevel: 'high', aliases: ['North Face', 'TNF', 'Nuptse'], notes: '' },
      { name: '巴塔哥尼亚', englishName: 'Patagonia', category: '运动与鞋服', riskLevel: 'high', aliases: ['Patagonia'], notes: '' },
      { name: '哥伦比亚', englishName: 'Columbia', category: '运动与鞋服', riskLevel: 'medium', aliases: ['Columbia'], notes: '' },
      { name: '安德玛', englishName: 'Under Armour', category: '运动与鞋服', riskLevel: 'high', aliases: ['UA', 'UnderArmour'], notes: '' },
      { name: '露露乐蒙', englishName: 'Lululemon', category: '运动与鞋服', riskLevel: 'high', aliases: ['lululemon', 'Lulu'], notes: '' },
      { name: '斯凯奇', englishName: 'Skechers', category: '运动与鞋服', riskLevel: 'medium', aliases: ['SKECHERS'], notes: '' },
      { name: '亚瑟士', englishName: 'ASICS', category: '运动与鞋服', riskLevel: 'medium', aliases: ['Asics', 'GEL'], notes: '' },
      { name: '美津浓', englishName: 'Mizuno', category: '运动与鞋服', riskLevel: 'medium', aliases: ['MIZUNO'], notes: '' },
      { name: 'Fila', englishName: 'Fila', category: '运动与鞋服', riskLevel: 'high', aliases: ['FILA', 'Filathlético'], notes: '' },
      { name: 'Champion', englishName: 'Champion', category: '运动与鞋服', riskLevel: 'medium', aliases: ['Champion'], notes: '' },
      { name: 'Under Armour', englishName: 'Under Armour', category: '运动与鞋服', riskLevel: 'high', aliases: ['UA'], notes: '' },
    ],
  },

  // ──────────── 奢侈品牌 ────────────
  {
    category: '奢侈品牌',
    brands: [
      { name: '古驰', englishName: 'Gucci', category: '奢侈品牌', riskLevel: 'high', aliases: ['GUCCI'], notes: '开云集团旗下' },
      { name: '路易威登', englishName: 'Louis Vuitton', category: '奢侈品牌', riskLevel: 'high', aliases: ['LV', 'LouisVuitton', 'LVMH'], notes: 'LVMH旗下' },
      { name: '香奈儿', englishName: 'Chanel', category: '奢侈品牌', riskLevel: 'high', aliases: ['CHANEL'], notes: '' },
      { name: '普拉达', englishName: 'Prada', category: '奢侈品牌', riskLevel: 'high', aliases: ['PRADA', 'Miu Miu'], notes: '含Miu Miu子品牌' },
      { name: '爱马仕', englishName: 'Hermès', category: '奢侈品牌', riskLevel: 'high', aliases: ['Hermes', 'HERMES'], notes: '' },
      { name: '博柏利', englishName: 'Burberry', category: '奢侈品牌', riskLevel: 'high', aliases: ['BURBERRY', 'Burberry Check'], notes: '经典格纹' },
      { name: '迪奥', englishName: 'Dior', category: '奢侈品牌', riskLevel: 'high', aliases: ['DIOR', 'Christian Dior'], notes: 'LVMH旗下' },
      { name: '范思哲', englishName: 'Versace', category: '奢侈品牌', riskLevel: 'high', aliases: ['VERSACE', 'Gianni Versace'], notes: '' },
      { name: '阿玛尼', englishName: 'Armani', category: '奢侈品牌', riskLevel: 'high', aliases: ['ARMANI', 'Giorgio Armani', 'Emporio Armani'], notes: '' },
      { name: '芬迪', englishName: 'Fendi', category: '奢侈品牌', riskLevel: 'high', aliases: ['FENDI'], notes: 'LVMH旗下' },
      { name: '圣罗兰', englishName: 'Yves Saint Laurent', category: '奢侈品牌', riskLevel: 'high', aliases: ['YSL', 'Saint Laurent', 'SLP'], notes: '开云集团旗下' },
      { name: '巴黎世家', englishName: 'Balenciaga', category: '奢侈品牌', riskLevel: 'high', aliases: ['BALENCIAGA'], notes: '开云集团旗下' },
      { name: '蔻驰', englishName: 'Coach', category: '奢侈品牌', riskLevel: 'medium', aliases: ['COACH', 'Tapestry'], notes: '' },
      { name: '迈克尔科尔斯', englishName: 'Michael Kors', category: '奢侈品牌', riskLevel: 'medium', aliases: ['MK', 'MichaelKors'], notes: '' },
      { name: 'Tory Burch', englishName: 'Tory Burch', category: '奢侈品牌', riskLevel: 'medium', aliases: ['ToryBurch'], notes: '' },
      { name: 'Celine', englishName: 'Celine', category: '奢侈品牌', riskLevel: 'high', aliases: ['CELINE', 'Céline'], notes: 'LVMH旗下' },
      { name: 'Bottega Veneta', englishName: 'Bottega Veneta', category: '奢侈品牌', riskLevel: 'high', aliases: ['BV', 'BottegaVeneta'], notes: '开云集团旗下' },
      { name: 'Valentino', englishName: 'Valentino', category: '奢侈品牌', riskLevel: 'high', aliases: ['VALENTINO', 'MaisonValentino'], notes: '' },
      { name: 'Givenchy', englishName: 'Givenchy', category: '奢侈品牌', riskLevel: 'high', aliases: ['GIVENCHY'], notes: 'LVMH旗下' },
      { name: 'Loewe', englishName: 'Loewe', category: '奢侈品牌', riskLevel: 'high', aliases: ['LOEWE'], notes: 'LVMH旗下' },
      { name: 'Moncler', englishName: 'Moncler', category: '奢侈品牌', riskLevel: 'high', aliases: ['MONCLER'], notes: '' },
      { name: 'Maison Margiela', englishName: 'Maison Margiela', category: '奢侈品牌', riskLevel: 'high', aliases: ['Margiela'], notes: '' },
      { name: 'Off-White', englishName: 'Off-White', category: '奢侈品牌', riskLevel: 'high', aliases: ['OFFWHITE', 'Off White'], notes: '' },
      { name: 'Supreme', englishName: 'Supreme', category: '奢侈品牌', riskLevel: 'high', aliases: ['SUPREME'], notes: '街头品牌' },
    ],
  },

  // ──────────── 珠宝与腕表 ────────────
  {
    category: '珠宝与腕表',
    brands: [
      { name: '劳力士', englishName: 'Rolex', category: '珠宝与腕表', riskLevel: 'high', aliases: ['ROLEX', 'Submariner', 'Daytona'], notes: '' },
      { name: '欧米茄', englishName: 'Omega', category: '珠宝与腕表', riskLevel: 'high', aliases: ['OMEGA', 'Speedmaster', 'Seamaster'], notes: 'Swatch集团' },
      { name: '卡地亚', englishName: 'Cartier', category: '珠宝与腕表', riskLevel: 'high', aliases: ['CARTIER'], notes: '历峰集团' },
      { name: '蒂芙尼', englishName: 'Tiffany', category: '珠宝与腕表', riskLevel: 'high', aliases: ['TIFFANY', 'Tiffany & Co', 'TiffanyCo'], notes: 'LVMH旗下' },
      { name: '宝格丽', englishName: 'Bulgari', category: '珠宝与腕表', riskLevel: 'high', aliases: ['BVLGARI'], notes: 'LVMH旗下' },
      { name: '梵克雅宝', englishName: 'Van Cleef & Arpels', category: '珠宝与腕表', riskLevel: 'high', aliases: ['VCA', 'VanCleef'], notes: '历峰集团' },
      { name: '百达翡丽', englishName: 'Patek Philippe', category: '珠宝与腕表', riskLevel: 'high', aliases: ['PatekPhilippe', 'Patek'], notes: '' },
      { name: '江诗丹顿', englishName: 'Vacheron Constantin', category: '珠宝与腕表', riskLevel: 'high', aliases: ['VacheronConstantin', 'Vacheron'], notes: '历峰集团' },
      { name: '浪琴', englishName: 'Longines', category: '珠宝与腕表', riskLevel: 'medium', aliases: ['LONGINES'], notes: 'Swatch集团' },
      { name: '天梭', englishName: 'Tissot', category: '珠宝与腕表', riskLevel: 'medium', aliases: ['TISSOT'], notes: 'Swatch集团' },
      { name: '施华洛世奇', englishName: 'Swarovski', category: '珠宝与腕表', riskLevel: 'high', aliases: ['SWAROVSKI'], notes: '' },
      { name: '潘多拉', englishName: 'Pandora', category: '珠宝与腕表', riskLevel: 'high', aliases: ['PANDORA'], notes: '' },
      { name: '周大福', englishName: 'Chow Tai Fook', category: '珠宝与腕表', riskLevel: 'medium', aliases: ['CTF', 'ChowTaiFook'], notes: '' },
      { name: 'Harry Winston', englishName: 'Harry Winston', category: '珠宝与腕表', riskLevel: 'high', aliases: ['HarryWinston'], notes: 'Swatch集团' },
      { name: 'Graff', englishName: 'Graff', category: '珠宝与腕表', riskLevel: 'high', aliases: ['GRAFF'], notes: '' },
    ],
  },

  // ──────────── 消费电子 ────────────
  {
    category: '消费电子',
    brands: [
      { name: '苹果', englishName: 'Apple', category: '消费电子', riskLevel: 'high', aliases: ['iPhone', 'iPad', 'MacBook', 'AirPods', 'iWatch', 'Apple Watch', 'iOS', 'Siri', 'MagSafe'], notes: '含AirPods/iPhone等子品牌' },
      { name: '三星', englishName: 'Samsung', category: '消费电子', riskLevel: 'high', aliases: ['SAMSUNG', 'Galaxy', 'Galaxy S', 'Galaxy Note', 'Galaxy Buds'], notes: '' },
      { name: '索尼', englishName: 'Sony', category: '消费电子', riskLevel: 'high', aliases: ['SONY', 'PlayStation', 'PS5', 'PS4', 'Walkman', 'Xperia'], notes: '含PlayStation游戏机' },
      { name: '微软', englishName: 'Microsoft', category: '消费电子', riskLevel: 'high', aliases: ['Microsoft', 'Xbox', 'Surface', 'Windows', 'Office 365'], notes: '' },
      { name: '谷歌', englishName: 'Google', category: '消费电子', riskLevel: 'high', aliases: ['Google', 'Pixel', 'Chromebook', 'Nest', 'Google Home'], notes: '' },
      { name: '华为', englishName: 'Huawei', category: '消费电子', riskLevel: 'medium', aliases: ['HUAWEI', 'Honor', 'HarmonyOS'], notes: '' },
      { name: '小米', englishName: 'Xiaomi', category: '消费电子', riskLevel: 'medium', aliases: ['XIAOMI', 'Redmi', 'Mi', 'POCO'], notes: '' },
      { name: 'OPPO', englishName: 'OPPO', category: '消费电子', riskLevel: 'medium', aliases: ['OPPO', 'Realme', 'OnePlus'], notes: '' },
      { name: 'LG', englishName: 'LG', category: '消费电子', riskLevel: 'high', aliases: ['LG Electronics'], notes: '' },
      { name: '松下', englishName: 'Panasonic', category: '消费电子', riskLevel: 'high', aliases: ['PANASONIC'], notes: '' },
      { name: '飞利浦', englishName: 'Philips', category: '消费电子', riskLevel: 'high', aliases: ['PHILIPS', 'Philips Hue'], notes: '' },
      { name: '博朗', englishName: 'Braun', category: '消费电子', riskLevel: 'high', aliases: ['BRAUN'], notes: 'P&G旗下' },
      { name: '戴森', englishName: 'Dyson', category: '消费电子', riskLevel: 'high', aliases: ['DYSON'], notes: '' },
      { name: 'Bose', englishName: 'Bose', category: '消费电子', riskLevel: 'high', aliases: ['BOSE'], notes: '' },
      { name: 'JBL', englishName: 'JBL', category: '消费电子', riskLevel: 'high', aliases: ['JBL'], notes: '三星旗下哈曼' },
      { name: '哈曼卡顿', englishName: 'Harman Kardon', category: '消费电子', riskLevel: 'medium', aliases: ['HarmanKardon'], notes: '三星旗下哈曼' },
      { name: 'Beats', englishName: 'Beats', category: '消费电子', riskLevel: 'high', aliases: ['Beats', 'Beats by Dre'], notes: 'Apple旗下' },
      { name: '罗技', englishName: 'Logitech', category: '消费电子', riskLevel: 'medium', aliases: ['LOGITECH', 'G Hub'], notes: '' },
      { name: '雷蛇', englishName: 'Razer', category: '消费电子', riskLevel: 'high', aliases: ['RAZER'], notes: '' },
      { name: '海盗船', englishName: 'Corsair', category: '消费电子', riskLevel: 'medium', aliases: ['CORSAIR'], notes: '' },
      { name: '英特尔', englishName: 'Intel', category: '消费电子', riskLevel: 'medium', aliases: ['Intel', 'Core i5', 'Core i7', 'Core i9'], notes: '' },
      { name: 'AMD', englishName: 'AMD', category: '消费电子', riskLevel: 'medium', aliases: ['AMD', 'Ryzen'], notes: '' },
      { name: '英伟达', englishName: 'NVIDIA', category: '消费电子', riskLevel: 'high', aliases: ['NVIDIA', 'GeForce', 'RTX', 'GTX'], notes: '' },
      { name: '闪迪', englishName: 'SanDisk', category: '消费电子', riskLevel: 'medium', aliases: ['SanDisk'], notes: 'WD旗下' },
      { name: '西部数据', englishName: 'Western Digital', category: '消费电子', riskLevel: 'medium', aliases: ['WD', 'WesternDigital'], notes: '' },
      { name: '希捷', englishName: 'Seagate', category: '消费电子', riskLevel: 'medium', aliases: ['Seagate'], notes: '' },
      { name: '惠普', englishName: 'HP', category: '消费电子', riskLevel: 'medium', aliases: ['HP', 'Hewlett Packard'], notes: '' },
      { name: '戴尔', englishName: 'Dell', category: '消费电子', riskLevel: 'medium', aliases: ['DELL', 'Alienware', 'XPS'], notes: '' },
      { name: '联想', englishName: 'Lenovo', category: '消费电子', riskLevel: 'medium', aliases: ['Lenovo', 'ThinkPad', 'IdeaPad', 'Legion'], notes: '' },
      { name: '华硕', englishName: 'ASUS', category: '消费电子', riskLevel: 'medium', aliases: ['ASUS', 'ROG'], notes: '' },
      { name: '宏碁', englishName: 'Acer', category: '消费电子', riskLevel: 'medium', aliases: ['Acer', 'Predator'], notes: '' },
      { name: '佳能', englishName: 'Canon', category: '消费电子', riskLevel: 'high', aliases: ['CANON', 'EOS'], notes: '' },
      { name: '尼康', englishName: 'Nikon', category: '消费电子', riskLevel: 'high', aliases: ['NIKON'], notes: '' },
      { name: 'GoPro', englishName: 'GoPro', category: '消费电子', riskLevel: 'high', aliases: ['GOPRO'], notes: '' },
      { name: '大疆', englishName: 'DJI', category: '消费电子', riskLevel: 'high', aliases: ['DJI', 'Mavic', 'Mini', 'Air'], notes: '' },
      { name: '安克', englishName: 'Anker', category: '消费电子', riskLevel: 'medium', aliases: ['ANKER', 'Soundcore'], notes: '' },
      { name: '贝尔金', englishName: 'Belkin', category: '消费电子', riskLevel: 'low', aliases: ['Belkin'], notes: '' },
      { name: 'OtterBox', englishName: 'OtterBox', category: '消费电子', riskLevel: 'medium', aliases: ['OtterBox'], notes: '' },
      { name: 'Nothing', englishName: 'Nothing', category: '消费电子', riskLevel: 'medium', aliases: ['Nothing Phone', 'Nothing Ear'], notes: '' },
    ],
  },

  // ──────────── 游戏与娱乐 ────────────
  {
    category: '游戏与娱乐',
    brands: [
      { name: '任天堂', englishName: 'Nintendo', category: '游戏与娱乐', riskLevel: 'high', aliases: ['NINTENDO', 'Switch', 'Nintendo Switch', 'Wii', 'GameCube'], notes: '' },
      { name: 'Xbox', englishName: 'Xbox', category: '游戏与娱乐', riskLevel: 'high', aliases: ['XBOX', 'Xbox Series X', 'Xbox Series S'], notes: '微软旗下' },
      { name: 'PlayStation', englishName: 'PlayStation', category: '游戏与娱乐', riskLevel: 'high', aliases: ['PS5', 'PS4', 'PS3', 'DualSense', 'DualShock'], notes: '索尼旗下' },
      { name: 'Steam', englishName: 'Steam', category: '游戏与娱乐', riskLevel: 'medium', aliases: ['STEAM', 'Valve'], notes: '' },
      { name: '宝可梦', englishName: 'Pokémon', category: '游戏与娱乐', riskLevel: 'high', aliases: ['Pokemon', 'Pokémon', 'Pikachu', '皮卡丘', 'Charizard', 'Eevee', 'Jigglypuff', 'Gengar', 'Mewtwo', '精灵宝可梦', '口袋妖怪'], notes: '任天堂/The Pokémon Company' },
      { name: '宝可梦', englishName: 'Pokémon', category: '游戏与娱乐', riskLevel: 'high', aliases: ['Bulbasaur', 'Squirtle', 'Snorlax', 'Lucario', 'Gardevoir', 'Umbreon', 'Sylveon'], notes: '宝可梦角色' },
      { name: '乐高', englishName: 'LEGO', category: '游戏与娱乐', riskLevel: 'high', aliases: ['LEGO', 'Legos', '乐高积木'], notes: '' },
      { name: '芭比', englishName: 'Barbie', category: '游戏与娱乐', riskLevel: 'high', aliases: ['BARBIE', 'Barbie Doll'], notes: 'Mattel旗下' },
      { name: 'Hot Wheels', englishName: 'Hot Wheels', category: '游戏与娱乐', riskLevel: 'high', aliases: ['HotWheels', '风火轮'], notes: 'Mattel旗下' },
      { name: 'NERF', englishName: 'NERF', category: '游戏与娱乐', riskLevel: 'high', aliases: ['NERF', 'Nerf'], notes: 'Hasbro旗下' },
      { name: 'Transformers', englishName: 'Transformers', category: '游戏与娱乐', riskLevel: 'high', aliases: ['变形金刚', 'Optimus Prime', 'Bumblebee', 'Megatron'], notes: 'Hasbro/Takara Tomy' },
      { name: 'G.I. Joe', englishName: 'G.I. Joe', category: '游戏与娱乐', riskLevel: 'high', aliases: ['G.I.Joe', '特种部队'], notes: 'Hasbro旗下' },
      { name: 'Furby', englishName: 'Furby', category: '游戏与娱乐', riskLevel: 'medium', aliases: ['FURBY'], notes: 'Hasbro旗下' },
      { name: 'Play-Doh', englishName: 'Play-Doh', category: '游戏与娱乐', riskLevel: 'medium', aliases: ['PlayDoh', '培乐多'], notes: 'Hasbro旗下' },
      { name: 'Monopoly', englishName: 'Monopoly', category: '游戏与娱乐', riskLevel: 'high', aliases: ['大富翁', 'MONOPOLY'], notes: 'Hasbro旗下' },
    ],
  },

  // ──────────── 影视与动漫IP ────────────
  {
    category: '影视与动漫IP',
    brands: [
      { name: '迪士尼', englishName: 'Disney', category: '影视与动漫IP', riskLevel: 'high', aliases: ['DISNEY', 'Walt Disney', 'Disneyland'], notes: '' },
      { name: '漫威', englishName: 'Marvel', category: '影视与动漫IP', riskLevel: 'high', aliases: ['MARVEL', 'Spider-Man', 'Batman', 'Iron Man', 'Captain America', 'Thor', 'Hulk', 'Avengers', '蜘蛛侠', '钢铁侠', '美国队长', '雷神', '绿巨人', '复仇者联盟', 'Black Panther', 'Doctor Strange', 'Ant-Man', 'Deadpool', 'Wolverine', 'X-Men'], notes: '迪士尼旗下' },
      { name: 'DC漫画', englishName: 'DC Comics', category: '影视与动漫IP', riskLevel: 'high', aliases: ['DC', 'Batman', 'Superman', 'Wonder Woman', 'Joker', 'Justice League', '蝙蝠侠', '超人', '神奇女侠', '小丑', '正义联盟', 'Harley Quinn', 'Aquaman', 'Flash'], notes: '华纳旗下' },
      { name: '星球大战', englishName: 'Star Wars', category: '影视与动漫IP', riskLevel: 'high', aliases: ['STARWARS', 'Darth Vader', 'Yoda', 'Luke Skywalker', 'Stormtrooper', 'R2-D2', 'BB-8', 'Grogu', 'Baby Yoda', '星球大战'], notes: '迪士尼旗下' },
      { name: '哈利·波特', englishName: 'Harry Potter', category: '影视与动漫IP', riskLevel: 'high', aliases: ['HarryPotter', 'Hogwarts', 'Hedwig', '霍格沃茨', '哈利伯特', 'Dumbledore', 'Voldemort', 'Hermione', 'Gryffindor', 'Slytherin'], notes: '华纳旗下' },
      { name: '华纳兄弟', englishName: 'Warner Bros', category: '影视与动漫IP', riskLevel: 'high', aliases: ['WarnerBros', 'WB', 'Warner Brothers'], notes: '' },
      { name: '环球影业', englishName: 'Universal', category: '影视与动漫IP', riskLevel: 'high', aliases: ['Universal Studios', 'Universal Pictures'], notes: '' },
      { name: '派拉蒙', englishName: 'Paramount', category: '影视与动漫IP', riskLevel: 'high', aliases: ['Paramount Pictures', 'Paramount+'], notes: '' },
      { name: '皮克斯', englishName: 'Pixar', category: '影视与动漫IP', riskLevel: 'high', aliases: ['PIXAR', 'Woody', 'Buzz Lightyear', 'Nemo', 'Dory', 'Elsa', 'Anna', 'Olaf', 'Mickey Mouse', 'Minnie Mouse', 'Donald Duck', 'Goofy', 'Pluto', 'Simba', 'Nala', '木迪', '巴斯光年', '尼莫', '冰雪奇缘', 'Frozen'], notes: '迪士尼旗下' },
      { name: '梦工厂', englishName: 'DreamWorks', category: '影视与动漫IP', riskLevel: 'high', aliases: ['DreamWorks', 'Shrek', 'Kung Fu Panda', 'Madagascar', '史瑞克', '功夫熊猫'], notes: '' },
      { name: 'Hello Kitty', englishName: 'Hello Kitty', category: '影视与动漫IP', riskLevel: 'high', aliases: ['HelloKitty', 'Kitty', 'Sanrio', 'My Melody', 'Cinnamoroll', 'Kuromi', 'Pompompurin', '凯蒂猫', '三丽鸥', '美乐蒂'], notes: '三丽鸥旗下' },
      { name: '吉卜力', englishName: 'Studio Ghibli', category: '影视与动漫IP', riskLevel: 'high', aliases: ['Ghibli', 'Totoro', '龙猫', '千与千寻', 'Chihiro', 'No Face', '无脸男', '千寻', 'Nausicaä', '风之谷', 'Howl', '哈尔的移动城堡', 'Spirited Away'], notes: '' },
      { name: '龙珠', englishName: 'Dragon Ball', category: '影视与动漫IP', riskLevel: 'high', aliases: ['DragonBall', 'Goku', '悟空', '卡卡罗特', 'Vegeta', '贝吉塔', '七龙珠'], notes: '集英社/东映' },
      { name: '海贼王', englishName: 'One Piece', category: '影视与动漫IP', riskLevel: 'high', aliases: ['OnePiece', 'Luffy', '路飞', 'Zoro', '索隆', 'Nami', '航海王'], notes: '集英社/东映' },
      { name: '火影忍者', englishName: 'Naruto', category: '影视与动漫IP', riskLevel: 'high', aliases: ['NARUTO', '鸣人', 'Sasuke', '佐助', 'Kakashi', '卡卡西', 'Itachi', '鼬'], notes: '集英社' },
      { name: '进击的巨人', englishName: 'Attack on Titan', category: '影视与动漫IP', riskLevel: 'high', aliases: ['AttackOnTitan', 'Shingeki', 'Eren', '艾伦', 'Mikasa', '三笠', 'Levi', '利威尔'], notes: '' },
      { name: 'Demon Slayer', englishName: 'Demon Slayer', category: '影视与动漫IP', riskLevel: 'high', aliases: ['Kimetsu', '鬼灭之刃', 'Tanjiro', '炭治郎', 'Nezuko', '祢豆子', 'Zenitsu', '善逸'], notes: '集英社' },
      { name: 'Jujutsu Kaisen', englishName: 'Jujutsu Kaisen', category: '影视与动漫IP', riskLevel: 'high', aliases: ['咒术回战', 'Gojo', '五条', 'Sukuna', 'Itadori', '虎杖'], notes: '集英社' },
      { name: 'Spy x Family', englishName: 'Spy x Family', category: '影视与动漫IP', riskLevel: 'high', aliases: ['间谍过家家', 'Anya', '阿尼亚', 'Loid', 'Yor', '间谍家家酒'], notes: '集英社' },
      { name: 'Peppa Pig', englishName: 'Peppa Pig', category: '影视与动漫IP', riskLevel: 'high', aliases: ['PeppaPig', '小猪佩奇', '佩佩猪'], notes: '' },
      { name: 'SpongeBob', englishName: 'SpongeBob', category: '影视与动漫IP', riskLevel: 'high', aliases: ['Spongebob SquarePants', '海绵宝宝', 'Patrick', '派大星'], notes: 'Nickelodeon' },
      { name: 'Paw Patrol', englishName: 'Paw Patrol', category: '影视与动漫IP', riskLevel: 'high', aliases: ['PawPatrol', '汪汪队', '汪汪队立大功', 'Chase', 'Marshall', 'Rubble'], notes: '' },
      { name: 'Frozen', englishName: 'Frozen', category: '影视与动漫IP', riskLevel: 'high', aliases: ['冰雪奇缘', 'Elsa', 'Anna', 'Olaf', 'Let It Go'], notes: '迪士尼' },
      { name: 'Toy Story', englishName: 'Toy Story', category: '影视与动漫IP', riskLevel: 'high', aliases: ['玩具总动员', 'Woody', 'Buzz', 'Jessie'], notes: '迪士尼/皮克斯' },
      { name: 'Minions', englishName: 'Minions', category: '影视与动漫IP', riskLevel: 'high', aliases: ['小黄人', 'Minion', 'Gru', 'Kevin', 'Stuart', 'Bob'], notes: '环球/照明娱乐' },
      { name: 'Minecraft', englishName: 'Minecraft', category: '影视与动漫IP', riskLevel: 'high', aliases: ['我的世界', 'MINECRAFT', 'Mojang'], notes: '微软旗下' },
      { name: 'Roblox', englishName: 'Roblox', category: '影视与动漫IP', riskLevel: 'medium', aliases: ['ROBLOX'], notes: '' },
      { name: 'Fortnite', englishName: 'Fortnite', category: '影视与动漫IP', riskLevel: 'high', aliases: ['堡垒之夜', 'FORTNITE', 'Epic Games'], notes: '' },
    ],
  },

  // ──────────── 食品与饮料 ────────────
  {
    category: '食品与饮料',
    brands: [
      { name: '可口可乐', englishName: 'Coca-Cola', category: '食品与饮料', riskLevel: 'high', aliases: ['CocaCola', 'Coke', '可口可乐', 'Coca Cola'], notes: '' },
      { name: '百事可乐', englishName: 'Pepsi', category: '食品与饮料', riskLevel: 'high', aliases: ['PEPSI', '百事'], notes: '' },
      { name: '麦当劳', englishName: "McDonald's", category: '食品与饮料', riskLevel: 'high', aliases: ['McDonalds', 'McDonald', 'McD', 'Big Mac', '麦当劳', 'McNuggets'], notes: '' },
      { name: '星巴克', englishName: 'Starbucks', category: '食品与饮料', riskLevel: 'high', aliases: ['STARBUCKS', '星巴克'], notes: '' },
      { name: '肯德基', englishName: 'KFC', category: '食品与饮料', riskLevel: 'high', aliases: ['Kentucky Fried Chicken', '肯德基'], notes: 'Yum! Brands' },
      { name: '汉堡王', englishName: 'Burger King', category: '食品与饮料', riskLevel: 'high', aliases: ['BurgerKing', '汉堡王', 'Whopper'], notes: '' },
      { name: '必胜客', englishName: 'Pizza Hut', category: '食品与饮料', riskLevel: 'high', aliases: ['PizzaHut', '必胜客'], notes: 'Yum! Brands' },
      { name: '赛百味', englishName: 'Subway', category: '食品与饮料', riskLevel: 'medium', aliases: ['SUBWAY', '赛百味'], notes: '' },
      { name: '红牛', englishName: 'Red Bull', category: '食品与饮料', riskLevel: 'high', aliases: ['RedBull', '红牛'], notes: '' },
      { name: '雀巢', englishName: 'Nestlé', category: '食品与饮料', riskLevel: 'high', aliases: ['Nestle', 'NESCAFE', 'Nespresso', 'KitKat', '雀巢'], notes: '含KitKat/Nespresso子品牌' },
      { name: '玛氏', englishName: "Mars", category: '食品与饮料', riskLevel: 'high', aliases: ['Mars', 'Snickers', 'M&M', 'Twix', 'Milky Way', '玛氏'], notes: '含Snickers/M&M子品牌' },
      { name: '亿滋', englishName: 'Mondelez', category: '食品与饮料', riskLevel: 'high', aliases: ['Mondelez', 'Oreo', '奥利奥', 'Cadbury', '吉百利', 'Toblerone'], notes: '含奥利奥/吉百利' },
      { name: '费列罗', englishName: 'Ferrero', category: '食品与饮料', riskLevel: 'high', aliases: ['Ferrero', 'Nutella', 'Kinder', 'Rocher', '费列罗', '能多益'], notes: '' },
      { name: '好时', englishName: "Hershey's", category: '食品与饮料', riskLevel: 'medium', aliases: ['Hersheys', 'Hershey', 'Kisses', '好时'], notes: '' },
      { name: '百威', englishName: 'Budweiser', category: '食品与饮料', riskLevel: 'medium', aliases: ['Budweiser', 'Bud'], notes: '' },
      { name: '喜力', englishName: 'Heineken', category: '食品与饮料', riskLevel: 'medium', aliases: ['Heineken', '喜力'], notes: '' },
      { name: '绝对伏特加', englishName: 'Absolut', category: '食品与饮料', riskLevel: 'medium', aliases: ['Absolut', '绝对伏特加'], notes: '' },
      { name: 'Jack Daniel\'s', englishName: "Jack Daniel's", category: '食品与饮料', riskLevel: 'medium', aliases: ['JackDaniels', 'Jack Daniels'], notes: '' },
      { name: 'Lay\'s', englishName: "Lay's", category: '食品与饮料', riskLevel: 'high', aliases: ['Lays', '乐事', 'Lays chips'], notes: '百事旗下' },
      { name: 'Pringles', englishName: 'Pringles', category: '食品与饮料', riskLevel: 'high', aliases: ['品客', 'PRINGLES'], notes: 'Kellogg\'s旗下' },
    ],
  },

  // ──────────── 美妆与个护 ────────────
  {
    category: '美妆与个护',
    brands: [
      { name: '欧莱雅', englishName: "L'Oréal", category: '美妆与个护', riskLevel: 'high', aliases: ['Loreal', 'LOREAL', 'Maybelline', '美宝莲', ' Garnier', '卡尼尔'], notes: '含美宝莲/卡尼尔子品牌' },
      { name: '雅诗兰黛', englishName: 'Estée Lauder', category: '美妆与个护', riskLevel: 'high', aliases: ['EsteeLauder', 'Estee Lauder', 'CLINIQUE', '倩碧', 'MAC', 'Bobbi Brown', 'Too Faced', 'La Mer'], notes: '含倩碧/MAC/La Mer子品牌' },
      { name: '兰蔻', englishName: 'Lancôme', category: '美妆与个护', riskLevel: 'high', aliases: ['Lancome', 'LANCOME'], notes: '欧莱雅旗下' },
      { name: '迪奥美妆', englishName: 'Dior Beauty', category: '美妆与个护', riskLevel: 'high', aliases: ['DiorBeauty', 'Dior Makeup'], notes: 'LVMH旗下' },
      { name: '香奈儿美妆', englishName: 'Chanel Beauty', category: '美妆与个护', riskLevel: 'high', aliases: ['ChanelBeauty'], notes: '' },
      { name: 'YSL美妆', englishName: 'YSL Beauty', category: '美妆与个护', riskLevel: 'high', aliases: ['YSLBeauty', 'YSL Makeup'], notes: '开云旗下' },
      { name: '纪梵希美妆', englishName: 'Givenchy Beauty', category: '美妆与个护', riskLevel: 'high', aliases: ['GivenchyBeauty'], notes: 'LVMH旗下' },
      { name: '资生堂', englishName: 'Shiseido', category: '美妆与个护', riskLevel: 'high', aliases: ['SHISEIDO', 'CPB', 'Clé de Peau', 'NARS'], notes: '含NARS/CPB子品牌' },
      { name: 'SK-II', englishName: 'SK-II', category: '美妆与个护', riskLevel: 'high', aliases: ['SKII', 'SK2'], notes: 'P&G旗下' },
      { name: '悦木之源', englishName: 'Origins', category: '美妆与个护', riskLevel: 'medium', aliases: ['Origins'], notes: '雅诗兰黛旗下' },
      { name: '海蓝之谜', englishName: 'La Mer', category: '美妆与个护', riskLevel: 'high', aliases: ['LAMER', 'LaMer'], notes: '雅诗兰黛旗下' },
      { name: '倩碧', englishName: 'Clinique', category: '美妆与个护', riskLevel: 'high', aliases: ['CLINIQUE'], notes: '雅诗兰黛旗下' },
      { name: '玉兰油', englishName: 'Olay', category: '美妆与个护', riskLevel: 'medium', aliases: ['OLAY'], notes: 'P&G旗下' },
      { name: '露得清', englishName: 'Neutrogena', category: '美妆与个护', riskLevel: 'medium', aliases: ['Neutrogena'], notes: 'J&J旗下' },
      { name: '蜜丝佛陀', englishName: 'Max Factor', category: '美妆与个护', riskLevel: 'medium', aliases: ['MaxFactor'], notes: '' },
      { name: 'Revlon', englishName: 'Revlon', category: '美妆与个护', riskLevel: 'medium', aliases: ['露华浓', 'REVLON'], notes: '' },
      { name: 'Sephora', englishName: 'Sephora', category: '美妆与个护', riskLevel: 'high', aliases: ['丝芙兰', 'SEPHORA'], notes: 'LVMH旗下' },
      { name: 'NYX', englishName: 'NYX', category: '美妆与个护', riskLevel: 'medium', aliases: ['NYX Professional'], notes: '欧莱雅旗下' },
      { name: 'Fenty Beauty', englishName: 'Fenty Beauty', category: '美妆与个护', riskLevel: 'high', aliases: ['FentyBeauty', 'Fenty'], notes: 'Rihanna品牌' },
      { name: 'Charlotte Tilbury', englishName: 'Charlotte Tilbury', category: '美妆与个护', riskLevel: 'medium', aliases: ['CharlotteTilbury', 'CT'], notes: '' },
      { name: 'NARS', englishName: 'NARS', category: '美妆与个护', riskLevel: 'high', aliases: ['NARS'], notes: '资生堂旗下' },
    ],
  },

  // ──────────── 汽车与配件 ────────────
  {
    category: '汽车与配件',
    brands: [
      { name: '特斯拉', englishName: 'Tesla', category: '汽车与配件', riskLevel: 'high', aliases: ['TESLA', 'Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'], notes: '' },
      { name: '宝马', englishName: 'BMW', category: '汽车与配件', riskLevel: 'high', aliases: ['BMW', 'Mini Cooper', 'MINI', 'Rolls-Royce', '宝马'], notes: '含MINI/Rolls-Royce子品牌' },
      { name: '奔驰', englishName: 'Mercedes-Benz', category: '汽车与配件', riskLevel: 'high', aliases: ['Mercedes', 'Benz', 'AMG', '奔驰', 'Maybach'], notes: '含AMG/Maybach' },
      { name: '保时捷', englishName: 'Porsche', category: '汽车与配件', riskLevel: 'high', aliases: ['PORSCHE', 'Cayenne', 'Macan', '911'], notes: '' },
      { name: '法拉利', englishName: 'Ferrari', category: '汽车与配件', riskLevel: 'high', aliases: ['FERRARI'], notes: '' },
      { name: '兰博基尼', englishName: 'Lamborghini', category: '汽车与配件', riskLevel: 'high', aliases: ['LAMBORGHINI', 'Huracán', 'Urus', 'Aventador'], notes: '' },
      { name: '丰田', englishName: 'Toyota', category: '汽车与配件', riskLevel: 'medium', aliases: ['TOYOTA', 'Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Prado', '丰田'], notes: '' },
      { name: '本田', englishName: 'Honda', category: '汽车与配件', riskLevel: 'medium', aliases: ['HONDA', 'Civic', 'Accord', 'CR-V', '本田'], notes: '' },
      { name: '福特', englishName: 'Ford', category: '汽车与配件', riskLevel: 'medium', aliases: ['FORD', 'Mustang', 'F-150', 'Bronco'], notes: '' },
      { name: '雪佛兰', englishName: 'Chevrolet', category: '汽车与配件', riskLevel: 'medium', aliases: ['Chevy', 'CHEVROLET', 'Camaro', 'Corvette', 'Silverado'], notes: '' },
      { name: '大众', englishName: 'Volkswagen', category: '汽车与配件', riskLevel: 'medium', aliases: ['VW', 'Volkswagen', 'Golf', 'Passat', 'Tiguan', '大众'], notes: '' },
      { name: '奥迪', englishName: 'Audi', category: '汽车与配件', riskLevel: 'high', aliases: ['AUDI', 'A4', 'A6', 'Q5', 'Q7', 'RS'], notes: '大众旗下' },
      { name: '雷克萨斯', englishName: 'Lexus', category: '汽车与配件', riskLevel: 'medium', aliases: ['LEXUS'], notes: '丰田旗下' },
      { name: '现代', englishName: 'Hyundai', category: '汽车与配件', riskLevel: 'low', aliases: ['HYUNDAI'], notes: '' },
      { name: '起亚', englishName: 'Kia', category: '汽车与配件', riskLevel: 'low', aliases: ['KIA'], notes: '' },
      { name: '日产', englishName: 'Nissan', category: '汽车与配件', riskLevel: 'medium', aliases: ['NISSAN', 'Altima', 'Sentra', 'Rogue'], notes: '' },
      { name: '马自达', englishName: 'Mazda', category: '汽车与配件', riskLevel: 'medium', aliases: ['MAZDA', 'CX-5', 'MX-5'], notes: '' },
      { name: '斯巴鲁', englishName: 'Subaru', category: '汽车与配件', riskLevel: 'medium', aliases: ['SUBARU', 'Outback', 'Forester'], notes: '' },
      { name: '玛莎拉蒂', englishName: 'Maserati', category: '汽车与配件', riskLevel: 'high', aliases: ['MASERATI'], notes: '' },
      { name: '宾利', englishName: 'Bentley', category: '汽车与配件', riskLevel: 'high', aliases: ['BENTLEY'], notes: '大众旗下' },
      { name: '阿斯顿马丁', englishName: 'Aston Martin', category: '汽车与配件', riskLevel: 'high', aliases: ['AstonMartin'], notes: '' },
      { name: 'McLaren', englishName: 'McLaren', category: '汽车与配件', riskLevel: 'high', aliases: ['迈凯伦', 'MCLAREN'], notes: '' },
    ],
  },

  // ──────────── 科技与软件 ────────────
  {
    category: '科技与软件',
    brands: [
      { name: 'Amazon', englishName: 'Amazon', category: '科技与软件', riskLevel: 'high', aliases: ['AMAZON', 'Alexa', 'Echo', 'Kindle', 'Prime', 'AWS'], notes: '' },
      { name: 'eBay', englishName: 'eBay', category: '科技与软件', riskLevel: 'medium', aliases: ['EBAY'], notes: '' },
      { name: 'Netflix', englishName: 'Netflix', category: '科技与软件', riskLevel: 'high', aliases: ['NETFLIX'], notes: '' },
      { name: 'Spotify', englishName: 'Spotify', category: '科技与软件', riskLevel: 'high', aliases: ['SPOTIFY'], notes: '' },
      { name: 'Uber', englishName: 'Uber', category: '科技与软件', riskLevel: 'medium', aliases: ['UBER'], notes: '' },
      { name: 'Airbnb', englishName: 'Airbnb', category: '科技与软件', riskLevel: 'medium', aliases: ['AIRBNB'], notes: '' },
      { name: 'Facebook', englishName: 'Facebook', category: '科技与软件', riskLevel: 'high', aliases: ['Facebook', 'Meta', 'META'], notes: '现Meta' },
      { name: 'Instagram', englishName: 'Instagram', category: '科技与软件', riskLevel: 'high', aliases: ['INSTAGRAM', 'Insta'], notes: 'Meta旗下' },
      { name: 'Twitter', englishName: 'Twitter', category: '科技与软件', riskLevel: 'medium', aliases: ['TWITTER', 'X', 'X Corp'], notes: '' },
      { name: 'YouTube', englishName: 'YouTube', category: '科技与软件', riskLevel: 'high', aliases: ['YOUTUBE'], notes: 'Google旗下' },
      { name: 'WhatsApp', englishName: 'WhatsApp', category: '科技与软件', riskLevel: 'high', aliases: ['WHATSAPP'], notes: 'Meta旗下' },
      { name: '微信', englishName: 'WeChat', category: '科技与软件', riskLevel: 'medium', aliases: ['WeChat', 'WECHAT'], notes: '腾讯旗下' },
      { name: 'TikTok', englishName: 'TikTok', category: '科技与软件', riskLevel: 'high', aliases: ['TIKTOK', '抖音', 'Douyin'], notes: '字节跳动旗下' },
      { name: 'LinkedIn', englishName: 'LinkedIn', category: '科技与软件', riskLevel: 'medium', aliases: ['LINKEDIN'], notes: '微软旗下' },
      { name: 'Snapchat', englishName: 'Snapchat', category: '科技与软件', riskLevel: 'medium', aliases: ['SNAPCHAT', 'Snap'], notes: '' },
      { name: 'Pinterest', englishName: 'Pinterest', category: '科技与软件', riskLevel: 'low', aliases: ['PINTEREST'], notes: '' },
      { name: 'Adobe', englishName: 'Adobe', category: '科技与软件', riskLevel: 'high', aliases: ['ADOBE', 'Photoshop', 'Illustrator', 'Premiere', 'Acrobat'], notes: '' },
      { name: 'Oracle', englishName: 'Oracle', category: '科技与软件', riskLevel: 'medium', aliases: ['ORACLE'], notes: '' },
      { name: 'Salesforce', englishName: 'Salesforce', category: '科技与软件', riskLevel: 'medium', aliases: ['SALESFORCE'], notes: '' },
      { name: 'SAP', englishName: 'SAP', category: '科技与软件', riskLevel: 'medium', aliases: ['SAP'], notes: '' },
      { name: 'Slack', englishName: 'Slack', category: '科技与软件', riskLevel: 'medium', aliases: ['SLACK'], notes: 'Salesforce旗下' },
      { name: 'Zoom', englishName: 'Zoom', category: '科技与软件', riskLevel: 'medium', aliases: ['ZOOM'], notes: '' },
    ],
  },

  // ──────────── 零售与电商 ────────────
  {
    category: '零售与电商',
    brands: [
      { name: '沃尔玛', englishName: 'Walmart', category: '零售与电商', riskLevel: 'high', aliases: ['WALMART', '沃尔玛', 'Sam\'s Club'], notes: '' },
      { name: 'Target', englishName: 'Target', category: '零售与电商', riskLevel: 'medium', aliases: ['TARGET', '塔吉特'], notes: '' },
      { name: 'Costco', englishName: 'Costco', category: '零售与电商', riskLevel: 'medium', aliases: ['COSTCO', '开市客'], notes: '' },
      { name: 'Home Depot', englishName: 'Home Depot', category: '零售与电商', riskLevel: 'medium', aliases: ['HomeDepot', '家得宝'], notes: '' },
      { name: 'IKEA', englishName: 'IKEA', category: '零售与电商', riskLevel: 'high', aliases: ['宜家', 'IKEA'], notes: '' },
      { name: 'Zara', englishName: 'Zara', category: '零售与电商', riskLevel: 'high', aliases: ['ZARA'], notes: 'Inditex旗下' },
      { name: 'H&M', englishName: 'H&M', category: '零售与电商', riskLevel: 'high', aliases: ['HM', 'Hennes & Mauritz'], notes: '' },
      { name: '优衣库', englishName: 'Uniqlo', category: '零售与电商', riskLevel: 'high', aliases: ['UNIQLO'], notes: '迅销集团旗下' },
      { name: 'Gap', englishName: 'Gap', category: '零售与电商', riskLevel: 'medium', aliases: ['GAP', 'Old Navy', 'Banana Republic'], notes: '含Old Navy/Banana Republic' },
      { name: 'Victoria\'s Secret', englishName: "Victoria's Secret", category: '零售与电商', riskLevel: 'high', aliases: ['VictoriasSecret', '维密', 'PINK'], notes: '' },
      { name: 'Calvin Klein', englishName: 'Calvin Klein', category: '零售与电商', riskLevel: 'high', aliases: ['CK', 'CalvinKlein'], notes: '' },
      { name: 'Ralph Lauren', englishName: 'Ralph Lauren', category: '零售与电商', riskLevel: 'high', aliases: ['Polo Ralph Lauren', 'Polo', 'RalphLauren'], notes: '' },
      { name: 'Tommy Hilfiger', englishName: 'Tommy Hilfiger', category: '零售与电商', riskLevel: 'high', aliases: ['TommyHilfiger', 'TOMMY'], notes: '' },
      { name: 'Levi\'s', englishName: "Levi's", category: '零售与电商', riskLevel: 'high', aliases: ['Levis', '501', 'LEVI'], notes: '' },
      { name: 'Dickies', englishName: 'Dickies', category: '零售与电商', riskLevel: 'medium', aliases: ['DICKIES'], notes: '' },
      { name: 'Carhartt', englishName: 'Carhartt', category: '零售与电商', riskLevel: 'medium', aliases: ['Carhartt WIP', 'CARHARTT'], notes: '' },
      { name: 'Timberland', englishName: 'Timberland', category: '零售与电商', riskLevel: 'high', aliases: ['TIMBERLAND'], notes: '' },
      { name: 'Dr. Martens', englishName: 'Dr. Martens', category: '零售与电商', riskLevel: 'high', aliases: ['DrMartens', 'Docs'], notes: '' },
      { name: 'Crocs', englishName: 'Crocs', category: '零售与电商', riskLevel: 'high', aliases: ['CROCS'], notes: '' },
      { name: 'Birkenstock', englishName: 'Birkenstock', category: '零售与电商', riskLevel: 'high', aliases: ['BIRKENSTOCK'], notes: '' },
    ],
  },

  // ──────────── 家居与家电 ────────────
  {
    category: '家居与家电',
    brands: [
      { name: '美的', englishName: 'Midea', category: '家居与家电', riskLevel: 'low', aliases: ['MIDEA', '美的'], notes: '' },
      { name: '格力', englishName: 'Gree', category: '家居与家电', riskLevel: 'low', aliases: ['GREE', '格力'], notes: '' },
      { name: '海尔', englishName: 'Haier', category: '家居与家电', riskLevel: 'low', aliases: ['HAIER', '海尔'], notes: '' },
      { name: '九阳', englishName: 'Joyoung', category: '家居与家电', riskLevel: 'low', aliases: ['JOYOUNG'], notes: '' },
      { name: '苏泊尔', englishName: 'Supor', category: '家居与家电', riskLevel: 'low', aliases: ['SUPOR', 'SEB旗下'], notes: 'SEB集团旗下' },
      { name: 'Whirlpool', englishName: 'Whirlpool', category: '家居与家电', riskLevel: 'medium', aliases: ['惠而浦', 'WHIRLPOOL'], notes: '' },
      { name: 'KitchenAid', englishName: 'KitchenAid', category: '家居与家电', riskLevel: 'high', aliases: ['KITCHENAID'], notes: 'Whirlpool旗下' },
      { name: 'Cuisinart', englishName: 'Cuisinart', category: '家居与家电', riskLevel: 'medium', aliases: ['CUISINART'], notes: '' },
      { name: 'Instant Pot', englishName: 'Instant Pot', category: '家居与家电', riskLevel: 'medium', aliases: ['InstantPot'], notes: '' },
      { name: 'Ninja', englishName: 'Ninja', category: '家居与家电', riskLevel: 'high', aliases: ['NINJA', 'Ninja Foodi'], notes: '' },
      { name: 'Breville', englishName: 'Breville', category: '家居与家电', riskLevel: 'medium', aliases: ['BREVILLE'], notes: '' },
      { name: 'iRobot', englishName: 'iRobot', category: '家居与家电', riskLevel: 'high', aliases: ['IROBOT', 'Roomba'], notes: '' },
      { name: ' Dyson', englishName: 'Dyson', category: '家居与家电', riskLevel: 'high', aliases: ['DYSON', 'V15', 'Supersonic', 'Airwrap'], notes: '' },
      { name: 'Shark', englishName: 'Shark', category: '家居与家电', riskLevel: 'medium', aliases: ['SHARK', 'SharkNinja'], notes: '' },
      { name: 'Roborock', englishName: 'Roborock', category: '家居与家电', riskLevel: 'medium', aliases: ['石头科技', 'ROBOROCK'], notes: '' },
      { name: 'Ecovacs', englishName: 'Ecovacs', category: '家居与家电', riskLevel: 'medium', aliases: ['科沃斯', 'DEEBOT', 'ECOVACS'], notes: '' },
    ],
  },

  // ──────────── 体育联盟与赛事 ────────────
  {
    category: '体育联盟与赛事',
    brands: [
      { name: 'FIFA', englishName: 'FIFA', category: '体育联盟与赛事', riskLevel: 'high', aliases: ['World Cup', '世界杯', 'FIFA23', 'FIFA24'], notes: '' },
      { name: 'NBA', englishName: 'NBA', category: '体育联盟与赛事', riskLevel: 'high', aliases: ['NBA', 'Basketball'], notes: '' },
      { name: 'NFL', englishName: 'NFL', category: '体育联盟与赛事', riskLevel: 'high', aliases: ['NFL', 'Super Bowl'], notes: '' },
      { name: '奥运会', englishName: 'Olympic', category: '体育联盟与赛事', riskLevel: 'high', aliases: ['Olympics', 'Olympic', '奥运', 'Olympic Games', '五环'], notes: '' },
      { name: 'UEFA', englishName: 'UEFA', category: '体育联盟与赛事', riskLevel: 'high', aliases: ['Champions League', '欧冠', 'UEFA'], notes: '' },
      { name: 'MLB', englishName: 'MLB', category: '体育联盟与赛事', riskLevel: 'high', aliases: ['Major League Baseball'], notes: '' },
      { name: 'UFC', englishName: 'UFC', category: '体育联盟与赛事', riskLevel: 'high', aliases: ['Ultimate Fighting Championship'], notes: '' },
      { name: 'F1', englishName: 'Formula 1', category: '体育联盟与赛事', riskLevel: 'high', aliases: ['F1', 'Formula1', '一级方程式'], notes: '' },
    ],
  },

  // ──────────── 设计师与潮流品牌 ────────────
  {
    category: '设计师与潮流品牌',
    brands: [
      { name: 'Travis Scott', englishName: 'Travis Scott', category: '设计师与潮流品牌', riskLevel: 'high', aliases: ['TravisScott', 'Cactus Jack'], notes: '' },
      { name: 'Kanye West', englishName: 'Kanye West', category: '设计师与潮流品牌', riskLevel: 'high', aliases: ['Yeezy', 'Ye', 'KANYE'], notes: 'Yeezy品牌' },
      { name: 'Kith', englishName: 'Kith', category: '设计师与潮流品牌', riskLevel: 'medium', aliases: ['KITH'], notes: '' },
      { name: 'Stüssy', englishName: 'Stüssy', category: '设计师与潮流品牌', riskLevel: 'high', aliases: ['STUSSY'], notes: '' },
      { name: 'BAPE', englishName: 'BAPE', category: '设计师与潮流品牌', riskLevel: 'high', aliases: ['A Bathing Ape', 'BAPE'], notes: '' },
      { name: 'Essentials', englishName: 'Essentials', category: '设计师与潮流品牌', riskLevel: 'high', aliases: ['Fear of God', 'FearOfGod', 'FOG'], notes: '' },
      { name: 'Palace', englishName: 'Palace', category: '设计师与潮流品牌', riskLevel: 'high', aliases: ['Palace Skateboards'], notes: '' },
    ],
  },

  // ──────────── 宠物品牌 ────────────
  {
    category: '宠物品牌',
    brands: [
      { name: 'Pedigree', englishName: 'Pedigree', category: '宠物品牌', riskLevel: 'medium', aliases: ['宝路', 'PEDIGREE'], notes: 'Mars旗下' },
      { name: 'Royal Canin', englishName: 'Royal Canin', category: '宠物品牌', riskLevel: 'high', aliases: ['皇家', 'ROYALCANIN'], notes: 'Mars旗下' },
      { name: 'Purina', englishName: 'Purina', category: '宠物品牌', riskLevel: 'medium', aliases: ['普瑞纳', 'PURINA', 'Friskies', 'Fancy Feast'], notes: 'Nestlé旗下' },
      { name: "Hill's", englishName: "Hill's", category: '宠物品牌', riskLevel: 'medium', aliases: ['Hills', 'Science Diet'], notes: 'Colgate旗下' },
      { name: 'Blue Buffalo', englishName: 'Blue Buffalo', category: '宠物品牌', riskLevel: 'medium', aliases: ['BlueBuffalo'], notes: 'General Mills旗下' },
    ],
  },

  // ──────────── 其他高风险品牌 ────────────
  {
    category: '其他高风险品牌',
    brands: [
      { name: '3M', englishName: '3M', category: '其他高风险品牌', riskLevel: 'high', aliases: ['3M', 'Post-it', 'Scotch', 'Command'], notes: '含Post-it/Command子品牌' },
      { name: 'Stanley', englishName: 'Stanley', category: '其他高风险品牌', riskLevel: 'high', aliases: ['STANLEY', 'Stanley Cup'], notes: '' },
      { name: 'Yeti', englishName: 'Yeti', category: '其他高风险品牌', riskLevel: 'high', aliases: ['YETI'], notes: '' },
      { name: 'Hydro Flask', englishName: 'Hydro Flask', category: '其他高风险品牌', riskLevel: 'high', aliases: ['HydroFlask'], notes: '' },
      { name: 'VICTORINOX', englishName: 'Victorinox', category: '其他高风险品牌', riskLevel: 'high', aliases: ['Swiss Army', 'Victorinox'], notes: '' },
      { name: 'Zippo', englishName: 'Zippo', category: '其他高风险品牌', riskLevel: 'high', aliases: ['ZIPPO'], notes: '' },
      { name: 'Leica', englishName: 'Leica', category: '其他高风险品牌', riskLevel: 'high', aliases: ['LEICA', '徕卡'], notes: '' },
      { name: 'Yeti', englishName: 'Yeti Coolers', category: '其他高风险品牌', riskLevel: 'high', aliases: ['YETI'], notes: '' },
    ],
  },
];

// ============================================================
// 已知IP角色名数据库（用于版权检测）
// ============================================================

export const IP_CHARACTERS: Array<{ name: string; franchise: string; englishName: string }> = [
  // 漫威/迪士尼
  { name: '蜘蛛侠', englishName: 'Spider-Man', franchise: 'Marvel/Disney' },
  { name: '钢铁侠', englishName: 'Iron Man', franchise: 'Marvel/Disney' },
  { name: '美国队长', englishName: 'Captain America', franchise: 'Marvel/Disney' },
  { name: '雷神', englishName: 'Thor', franchise: 'Marvel/Disney' },
  { name: '绿巨人', englishName: 'Hulk', franchise: 'Marvel/Disney' },
  { name: '黑豹', englishName: 'Black Panther', franchise: 'Marvel/Disney' },
  { name: '奇异博士', englishName: 'Doctor Strange', franchise: 'Marvel/Disney' },
  { name: '死侍', englishName: 'Deadpool', franchise: 'Marvel/Disney' },
  { name: '金刚狼', englishName: 'Wolverine', franchise: 'Marvel/Disney' },
  { name: '蚁人', englishName: 'Ant-Man', franchise: 'Marvel/Disney' },
  { name: '复仇者联盟', englishName: 'Avengers', franchise: 'Marvel/Disney' },
  // DC
  { name: '蝙蝠侠', englishName: 'Batman', franchise: 'DC/Warner' },
  { name: '超人', englishName: 'Superman', franchise: 'DC/Warner' },
  { name: '神奇女侠', englishName: 'Wonder Woman', franchise: 'DC/Warner' },
  { name: '小丑', englishName: 'Joker', franchise: 'DC/Warner' },
  { name: '哈莉·奎茵', englishName: 'Harley Quinn', franchise: 'DC/Warner' },
  { name: '闪电侠', englishName: 'Flash', franchise: 'DC/Warner' },
  { name: '正义联盟', englishName: 'Justice League', franchise: 'DC/Warner' },
  // 迪士尼/皮克斯
  { name: '米老鼠', englishName: 'Mickey Mouse', franchise: 'Disney' },
  { name: '米妮', englishName: 'Minnie Mouse', franchise: 'Disney' },
  { name: '唐老鸭', englishName: 'Donald Duck', franchise: 'Disney' },
  { name: '高飞', englishName: 'Goofy', franchise: 'Disney' },
  { name: '辛巴', englishName: 'Simba', franchise: 'Disney' },
  { name: '艾莎', englishName: 'Elsa', franchise: 'Disney/Frozen' },
  { name: '安娜', englishName: 'Anna', franchise: 'Disney/Frozen' },
  { name: '雪宝', englishName: 'Olaf', franchise: 'Disney/Frozen' },
  { name: '胡迪', englishName: 'Woody', franchise: 'Pixar/Toy Story' },
  { name: '巴斯光年', englishName: 'Buzz Lightyear', franchise: 'Pixar/Toy Story' },
  { name: '尼莫', englishName: 'Nemo', franchise: 'Pixar' },
  { name: '多莉', englishName: 'Dory', franchise: 'Pixar' },
  // 宝可梦
  { name: '皮卡丘', englishName: 'Pikachu', franchise: 'Pokémon' },
  { name: '喷火龙', englishName: 'Charizard', franchise: 'Pokémon' },
  { name: '伊布', englishName: 'Eevee', franchise: 'Pokémon' },
  { name: '胖丁', englishName: 'Jigglypuff', franchise: 'Pokémon' },
  { name: '耿鬼', englishName: 'Gengar', franchise: 'Pokémon' },
  { name: '超梦', englishName: 'Mewtwo', franchise: 'Pokémon' },
  { name: '卡比兽', englishName: 'Snorlax', franchise: 'Pokémon' },
  { name: '路卡利欧', englishName: 'Lucario', franchise: 'Pokémon' },
  // 动漫
  { name: '悟空', englishName: 'Goku', franchise: 'Dragon Ball' },
  { name: '贝吉塔', englishName: 'Vegeta', franchise: 'Dragon Ball' },
  { name: '路飞', englishName: 'Luffy', franchise: 'One Piece' },
  { name: '索隆', englishName: 'Zoro', franchise: 'One Piece' },
  { name: '鸣人', englishName: 'Naruto', franchise: 'Naruto' },
  { name: '佐助', englishName: 'Sasuke', franchise: 'Naruto' },
  { name: '艾伦', englishName: 'Eren', franchise: 'Attack on Titan' },
  { name: '三笠', englishName: 'Mikasa', franchise: 'Attack on Titan' },
  { name: '利威尔', englishName: 'Levi', franchise: 'Attack on Titan' },
  { name: '炭治郎', englishName: 'Tanjiro', franchise: 'Demon Slayer' },
  { name: '祢豆子', englishName: 'Nezuko', franchise: 'Demon Slayer' },
  { name: '五条', englishName: 'Gojo', franchise: 'Jujutsu Kaisen' },
  { name: '阿尼亚', englishName: 'Anya', franchise: 'Spy x Family' },
  // 吉卜力
  { name: '龙猫', englishName: 'Totoro', franchise: 'Ghibli' },
  { name: '千寻', englishName: 'Chihiro', franchise: 'Ghibli/Spirited Away' },
  { name: '无脸男', englishName: 'No Face', franchise: 'Ghibli/Spirited Away' },
  // 其他
  { name: '海绵宝宝', englishName: 'SpongeBob', franchise: 'Nickelodeon' },
  { name: '小猪佩奇', englishName: 'Peppa Pig', franchise: 'Peppa Pig' },
  { name: '小黄人', englishName: 'Minions', franchise: 'Universal' },
  { name: '史瑞克', englishName: 'Shrek', franchise: 'DreamWorks' },
  { name: '凯蒂猫', englishName: 'Hello Kitty', franchise: 'Sanrio' },
  { name: '美乐蒂', englishName: 'My Melody', franchise: 'Sanrio' },
  // 星战
  { name: '达斯·维达', englishName: 'Darth Vader', franchise: 'Star Wars' },
  { name: '尤达', englishName: 'Yoda', franchise: 'Star Wars' },
  { name: '格洛古', englishName: 'Grogu', franchise: 'Star Wars' },
  // 哈利波特
  { name: '哈利·波特', englishName: 'Harry Potter', franchise: 'Harry Potter' },
  { name: '霍格沃茨', englishName: 'Hogwarts', franchise: 'Harry Potter' },
  { name: '伏地魔', englishName: 'Voldemort', franchise: 'Harry Potter' },
  // 游戏
  { name: '马里奥', englishName: 'Mario', franchise: 'Nintendo' },
  { name: '路易吉', englishName: 'Luigi', franchise: 'Nintendo' },
  { name: '林克', englishName: 'Link', franchise: 'Nintendo/Zelda' },
  { name: '塞尔达', englishName: 'Zelda', franchise: 'Nintendo/Zelda' },
  { name: '大金刚', englishName: 'Donkey Kong', franchise: 'Nintendo' },
  { name: '卡比', englishName: 'Kirby', franchise: 'Nintendo' },
];

// ============================================================
// 知名影视/游戏作品名称（用于版权检测）
// ============================================================

export const IP_FRANCHISES: Array<{ name: string; englishName: string; owner: string }> = [
  { name: '星球大战', englishName: 'Star Wars', owner: 'Disney' },
  { name: '哈利·波特', englishName: 'Harry Potter', owner: 'Warner Bros' },
  { name: '指环王', englishName: 'Lord of the Rings', owner: 'Warner Bros' },
  { name: '漫威电影宇宙', englishName: 'Marvel Cinematic Universe', owner: 'Disney' },
  { name: '冰雪奇缘', englishName: 'Frozen', owner: 'Disney' },
  { name: '玩具总动员', englishName: 'Toy Story', owner: 'Disney/Pixar' },
  { name: '狮子王', englishName: 'The Lion King', owner: 'Disney' },
  { name: '海底总动员', englishName: 'Finding Nemo', owner: 'Disney/Pixar' },
  { name: '超人总动员', englishName: 'The Incredibles', owner: 'Disney/Pixar' },
  { name: '侏罗纪公园', englishName: 'Jurassic Park', owner: 'Universal' },
  { name: '变形金刚', englishName: 'Transformers', owner: 'Hasbro' },
  { name: '速度与激情', englishName: 'Fast and Furious', owner: 'Universal' },
  { name: '碟中谍', englishName: 'Mission Impossible', owner: 'Paramount' },
  { name: '007', englishName: 'James Bond', owner: 'MGM' },
  { name: '我的世界', englishName: 'Minecraft', owner: 'Microsoft' },
  { name: '堡垒之夜', englishName: 'Fortnite', owner: 'Epic Games' },
  { name: '龙珠', englishName: 'Dragon Ball', owner: 'Shueisha/Toei' },
  { name: '海贼王', englishName: 'One Piece', owner: 'Shueisha/Toei' },
  { name: '火影忍者', englishName: 'Naruto', owner: 'Shueisha' },
  { name: '鬼灭之刃', englishName: 'Demon Slayer', owner: 'Shueisha' },
  { name: '进击的巨人', englishName: 'Attack on Titan', owner: 'Kodansha' },
  { name: '咒术回战', englishName: 'Jujutsu Kaisen', owner: 'Shueisha' },
  { name: '间谍过家家', englishName: 'Spy x Family', owner: 'Shueisha' },
  { name: '千与千寻', englishName: 'Spirited Away', owner: 'Ghibli' },
  { name: '龙猫', englishName: 'My Neighbor Totoro', owner: 'Ghibli' },
  { name: '哈尔的移动城堡', englishName: 'Howl\'s Moving Castle', owner: 'Ghibli' },
  { name: '风之谷', englishName: 'Nausicaä', owner: 'Ghibli' },
  { name: '功夫熊猫', englishName: 'Kung Fu Panda', owner: 'DreamWorks' },
  { name: '小黄人', englishName: 'Minions', owner: 'Universal' },
  { name: '汪汪队立大功', englishName: 'Paw Patrol', owner: 'Spin Master' },
  { name: '小猪佩奇', englishName: 'Peppa Pig', owner: 'Hasbro/eOne' },
];
