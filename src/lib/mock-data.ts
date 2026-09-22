import { HotItem, Order, Product, Notification } from './config';

export const mockProducts: Product[] = [
  { id: 'P001', name: '硅胶手机壳 iPhone 15 Pro Max', category: '手机壳', purchasePrice: 3.5, sellingPrice: 5.99, weight: 30, size: { l: 16, w: 8, h: 1 }, site: 'MLM', status: 'active', rating: 4.5, soldRange: '100-150件', store: 'Store_MLM_0' },
  { id: 'P002', name: 'Type-C 快充数据线 1.5m', category: '数据线', purchasePrice: 2.8, sellingPrice: 4.99, weight: 25, size: { l: 18, w: 5, h: 2 }, site: 'MLM', status: 'active', rating: 4.3, soldRange: '200-300件', store: 'Store_MLM_1' },
  { id: 'P003', name: '925纯银耳钉 简约圆球', category: '耳饰', purchasePrice: 8.0, sellingPrice: 12.99, weight: 5, size: { l: 5, w: 5, h: 2 }, site: 'MLB', status: 'active', rating: 4.7, soldRange: '50-100件', store: 'Store_MLB_0' },
  { id: 'P004', name: '透明亚克力收纳盒 化妆品', category: '收纳件', purchasePrice: 12.0, sellingPrice: 18.99, weight: 200, size: { l: 20, w: 15, h: 10 }, site: 'MLM', status: 'active', rating: 4.2, soldRange: '100-150件', store: 'Store_MLM_2' },
  { id: 'P005', name: 'LED小夜灯 USB充电 折叠式', category: 'LED灯', purchasePrice: 15.0, sellingPrice: 22.99, weight: 120, size: { l: 12, w: 8, h: 15 }, site: 'MLA', status: 'active', rating: 4.6, soldRange: '50-100件', store: 'Store_MLA_0' },
  { id: 'P006', name: '美妆蛋套装 4只装', category: '美妆小工具', purchasePrice: 5.0, sellingPrice: 8.99, weight: 60, size: { l: 10, w: 10, h: 8 }, site: 'MLC', status: 'active', rating: 4.4, soldRange: '200-300件', store: 'Store_MLC_0' },
  { id: 'P007', name: 'Apple Watch 表带 硅胶运动款', category: '表带', purchasePrice: 6.0, sellingPrice: 9.99, weight: 20, size: { l: 22, w: 3, h: 1 }, site: 'MLM', status: 'active', rating: 4.1, soldRange: '150-200件', store: 'Store_MLM_3' },
  { id: 'P008', name: '钢化玻璃屏幕保护膜 通用', category: '屏幕保护膜', purchasePrice: 1.5, sellingPrice: 3.99, weight: 15, size: { l: 17, w: 9, h: 0.5 }, site: 'MLB', status: 'active', rating: 4.0, soldRange: '500-1000件', store: 'Store_MLB_1' },
  { id: 'P009', name: '轻透气跑步鞋 飞织面料', category: '运动鞋', purchasePrice: 45.0, sellingPrice: 65.99, weight: 500, size: { l: 32, w: 20, h: 12 }, site: 'MLM', status: 'active', rating: 4.5, soldRange: '25-50件', store: 'Store_MLM_4' },
  { id: 'P010', name: '卡通PVC手办 15cm', category: '玩具/手办', purchasePrice: 18.0, sellingPrice: 28.99, weight: 150, size: { l: 15, w: 10, h: 20 }, site: 'MCO', status: 'active', rating: 4.8, soldRange: '50-100件', store: 'Store_MCO_0' },
  { id: 'P011', name: '桌面收纳架 多层旋转', category: '家居收纳', purchasePrice: 22.0, sellingPrice: 35.99, weight: 350, size: { l: 25, w: 25, h: 30 }, site: 'MLM', status: 'paused', rating: 4.3, soldRange: '25-50件', store: 'Store_MLM_5' },
  { id: 'P012', name: '蓝牙耳机 无线入耳式', category: '其他', purchasePrice: 25.0, sellingPrice: 39.99, weight: 45, size: { l: 8, w: 5, h: 3 }, site: 'MLM', status: 'active', rating: 4.2, soldRange: '200-300件', store: 'Store_MLM_6' },
  { id: 'P013', name: '手机支架 桌面折叠铝合金', category: '其他', purchasePrice: 8.0, sellingPrice: 14.99, weight: 100, size: { l: 15, w: 10, h: 12 }, site: 'MLB', status: 'active', rating: 4.6, soldRange: '100-150件', store: 'Store_MLB_2' },
  { id: 'P014', name: '车载手机充电器 双口USB', category: '其他', purchasePrice: 10.0, sellingPrice: 16.99, weight: 50, size: { l: 8, w: 4, h: 3 }, site: 'MLA', status: 'reviewing', rating: 4.0, soldRange: '50-100件', store: 'Store_MLA_1' },
  { id: 'P015', name: '迷你风扇 USB充电 便携', category: '其他', purchasePrice: 12.0, sellingPrice: 19.99, weight: 80, size: { l: 10, w: 5, h: 15 }, site: 'MLC', status: 'active', rating: 4.4, soldRange: '100-150件', store: 'Store_MLC_1' },
  { id: 'P016', name: '运动腰包 防水触屏', category: '其他', purchasePrice: 7.0, sellingPrice: 11.99, weight: 40, size: { l: 20, w: 8, h: 3 }, site: 'MCO', status: 'active', rating: 4.1, soldRange: '50-100件', store: 'Store_MCO_1' },
  { id: 'P017', name: 'LED补光灯 自拍环形灯', category: 'LED灯', purchasePrice: 18.0, sellingPrice: 29.99, weight: 200, size: { l: 20, w: 20, h: 5 }, site: 'MLM', status: 'active', rating: 4.5, soldRange: '25-50件', store: 'Store_MLM_7' },
  { id: 'P018', name: '硅胶厨房铲套装 6件', category: '家居收纳', purchasePrice: 20.0, sellingPrice: 32.99, weight: 280, size: { l: 30, w: 10, h: 8 }, site: 'MLB', status: 'closed', rating: 4.7, soldRange: '50-100件', store: 'Store_MLB_3' },
  { id: 'P019', name: '手机挂绳 斜挎可调节', category: '其他', purchasePrice: 2.0, sellingPrice: 4.99, weight: 10, size: { l: 50, w: 2, h: 1 }, site: 'MLM', status: 'active', rating: 3.9, soldRange: '500-1000件', store: 'Store_MLM_8' },
  { id: 'P020', name: '无线充电板 15W快充', category: '其他', purchasePrice: 28.0, sellingPrice: 42.99, weight: 80, size: { l: 10, w: 10, h: 1 }, site: 'MLA', status: 'active', rating: 4.3, soldRange: '25-50件', store: 'Store_MLA_2' },
  { id: 'P021', name: '防水蓝牙音箱 户外便携', category: '其他', purchasePrice: 35.0, sellingPrice: 52.99, weight: 250, size: { l: 12, w: 6, h: 6 }, site: 'MLM', status: 'active', rating: 4.6, soldRange: '25-50件', store: 'Store_MLM_9' },
  { id: 'P022', name: '多功能工具钳 不锈钢折叠', category: '其他', purchasePrice: 25.0, sellingPrice: 38.99, weight: 180, size: { l: 10, w: 3, h: 8 }, site: 'MCO', status: 'active', rating: 4.8, soldRange: '50-100件', store: 'Store_MCO_2' },
];

export const mockOrders: Order[] = [
  { id: 'O001', orderId: 'MLM-20240101-001', buyer: 'Carlos G.', product: '硅胶手机壳 iPhone 15 Pro Max', amount: 5.99, currency: 'USD', status: 'paid', shipping: '已发货', date: '2024-01-15', site: 'MLM' },
  { id: 'O002', orderId: 'MLM-20240101-002', buyer: 'Maria L.', product: 'Type-C 快充数据线 1.5m', amount: 9.98, currency: 'USD', status: 'shipped', shipping: '运输中', date: '2024-01-14', site: 'MLM' },
  { id: 'O003', orderId: 'MLB-20240101-001', buyer: 'João S.', product: '925纯银耳钉 简约圆球', amount: 12.99, currency: 'USD', status: 'paid', shipping: '待发货', date: '2024-01-13', site: 'MLB' },
  { id: 'O004', orderId: 'MLM-20240101-003', buyer: 'Ana R.', product: '透明亚克力收纳盒 化妆品', amount: 18.99, currency: 'USD', status: 'paid', shipping: '待发货', date: '2024-01-12', site: 'MLM' },
  { id: 'O005', orderId: 'MLA-20240101-001', buyer: 'Diego M.', product: 'LED小夜灯 USB充电 折叠式', amount: 22.99, currency: 'USD', status: 'pending', shipping: '待付款', date: '2024-01-11', site: 'MLA' },
  { id: 'O006', orderId: 'MLC-20240101-001', buyer: 'Camila P.', product: '美妆蛋套装 4只装', amount: 17.98, currency: 'USD', status: 'shipped', shipping: '运输中', date: '2024-01-10', site: 'MLC' },
  { id: 'O007', orderId: 'MLM-20240101-004', buyer: 'Luis H.', product: 'Apple Watch 表带 硅胶运动款', amount: 9.99, currency: 'USD', status: 'paid', shipping: '已发货', date: '2024-01-09', site: 'MLM' },
  { id: 'O008', orderId: 'MLB-20240101-002', buyer: 'Pedro A.', product: '钢化玻璃屏幕保护膜 通用', amount: 7.98, currency: 'USD', status: 'cancelled', shipping: '已取消', date: '2024-01-08', site: 'MLB' },
  { id: 'O009', orderId: 'MLM-20240101-005', buyer: 'Sofia V.', product: '轻透气跑步鞋 飞织面料', amount: 65.99, currency: 'USD', status: 'paid', shipping: '待发货', date: '2024-01-07', site: 'MLM' },
  { id: 'O010', orderId: 'MCO-20240101-001', buyer: 'Valentina C.', product: '卡通PVC手办 15cm', amount: 28.99, currency: 'USD', status: 'shipped', shipping: '运输中', date: '2024-01-06', site: 'MCO' },
  { id: 'O011', orderId: 'MLM-20240102-001', buyer: 'Roberto F.', product: '蓝牙耳机 无线入耳式', amount: 39.99, currency: 'USD', status: 'paid', shipping: '已发货', date: '2024-01-05', site: 'MLM' },
  { id: 'O012', orderId: 'MLB-20240102-001', buyer: 'Fernanda B.', product: '手机支架 桌面折叠铝合金', amount: 29.98, currency: 'USD', status: 'paid', shipping: '待发货', date: '2024-01-04', site: 'MLB' },
  { id: 'O013', orderId: 'MLA-20240102-001', buyer: 'Martin R.', product: '车载手机充电器 双口USB', amount: 16.99, currency: 'USD', status: 'pending', shipping: '待付款', date: '2024-01-03', site: 'MLA' },
  { id: 'O014', orderId: 'MLC-20240102-001', buyer: 'Isidora T.', product: '迷你风扇 USB充电 便携', amount: 39.98, currency: 'USD', status: 'shipped', shipping: '运输中', date: '2024-01-02', site: 'MLC' },
  { id: 'O015', orderId: 'MCO-20240102-001', buyer: 'Daniela G.', product: '运动腰包 防水触屏', amount: 23.98, currency: 'USD', status: 'paid', shipping: '已发货', date: '2024-01-01', site: 'MCO' },
  { id: 'O016', orderId: 'MLM-20240103-001', buyer: 'Alejandro M.', product: 'LED补光灯 自拍环形灯', amount: 29.99, currency: 'USD', status: 'paid', shipping: '待发货', date: '2023-12-31', site: 'MLM' },
  { id: 'O017', orderId: 'MLM-20240103-002', buyer: 'Gabriela S.', product: '手机挂绳 斜挎可调节', amount: 9.98, currency: 'USD', status: 'cancelled', shipping: '已取消', date: '2023-12-30', site: 'MLM' },
  { id: 'O018', orderId: 'MLB-20240103-001', buyer: 'Lucas O.', product: '无线充电板 15W快充', amount: 42.99, currency: 'USD', status: 'shipped', shipping: '运输中', date: '2023-12-29', site: 'MLB' },
  { id: 'O019', orderId: 'MLM-20240103-003', buyer: 'Paula N.', product: '防水蓝牙音箱 户外便携', amount: 52.99, currency: 'USD', status: 'paid', shipping: '已发货', date: '2023-12-28', site: 'MLM' },
  { id: 'O020', orderId: 'MCO-20240103-001', buyer: 'Sebastian L.', product: '多功能工具钳 不锈钢折叠', amount: 38.99, currency: 'USD', status: 'paid', shipping: '待发货', date: '2023-12-27', site: 'MCO' },
  { id: 'O021', orderId: 'MLM-20240104-001', buyer: 'Ricardo D.', product: '桌面收纳架 多层旋转', amount: 71.98, currency: 'USD', status: 'paid', shipping: '已发货', date: '2023-12-26', site: 'MLM' },
  { id: 'O022', orderId: 'MLA-20240104-001', buyer: 'Julieta K.', product: '硅胶厨房铲套装 6件', amount: 32.99, currency: 'USD', status: 'pending', shipping: '待付款', date: '2023-12-25', site: 'MLA' },
];

export const mockHotItems: HotItem[] = [
  { id: 'H001', title: 'Audífonos Bluetooth Inalámbricos con Micrófono HD', price: 189, currency: 'MXN', rating: 4.0, soldRange: '已售 25-50件', store: 'Store_MLM_0' },
  { id: 'H002', title: 'Funda Protectora para iPhone 15 Pro Max Silicona', price: 79, currency: 'MXN', rating: 4.2, soldRange: '已售 25-50件', store: 'Store_MLM_1' },
  { id: 'H003', title: 'Cargador Rápido USB-C 65W GaN Portátil', price: 259, currency: 'MXN', rating: 4.4, soldRange: '已售 25-50件', store: 'Store_MLM_2' },
  { id: 'H004', title: 'Smartwatch Deportivo Monitor Cardíaco IP68', price: 459, currency: 'MXN', rating: 4.6, soldRange: '已售 50-100件', store: 'Store_MLM_3' },
  { id: 'H005', title: 'Lámpara LED de Escritorio Plegable con USB', price: 149, currency: 'MXN', rating: 4.8, soldRange: '已售 50-100件', store: 'Store_MLM_4' },
  { id: 'H006', title: 'Organizador de Maquillaje Acrílico Transparente', price: 129, currency: 'MXN', rating: 4.0, soldRange: '已售 100-150件', store: 'Store_MLM_5' },
  { id: 'H007', title: 'Cable HDMI 2.1 8K Ultra HD 2 Metros', price: 99, currency: 'MXN', rating: 4.2, soldRange: '已售 150-200件', store: 'Store_MLM_6' },
  { id: 'H008', title: 'Mochila Antirrobo Impermeable con Puerto USB', price: 349, currency: 'MXN', rating: 4.4, soldRange: '已售 200-250件', store: 'Store_MLM_7' },
  { id: 'H009', title: 'Mini Proyector Portátil WiFi Bluetooth 5.0', price: 1299, currency: 'MXN', rating: 4.6, soldRange: '已售 250-500件', store: 'Store_MLM_8' },
  { id: 'H010', title: 'Set de Brochas de Maquillaje Profesional 12pcs', price: 169, currency: 'MXN', rating: 4.8, soldRange: '已售 250-500件', store: 'Store_MLM_9' },
  { id: 'H011', title: 'Teclado Mecánico Inalámbrico RGB 75%', price: 399, currency: 'MXN', rating: 4.0, soldRange: '已售 500-5000件', store: 'Store_MLM_10' },
  { id: 'H012', title: 'Bocina Portátil Bluetooth Resistente al Agua', price: 279, currency: 'MXN', rating: 4.2, soldRange: '已售 500-5000件', store: 'Store_MLM_11' },
  { id: 'H013', title: 'Soporte para Laptop Ajustable Aluminio', price: 219, currency: 'MXN', rating: 4.4, soldRange: '已售 500-5000件', store: 'Store_MLM_12' },
  { id: 'H014', title: 'Cámara de Seguridad WiFi 360° Visión Nocturna', price: 329, currency: 'MXN', rating: 4.6, soldRange: '已售 5000件以上', store: 'Store_MLM_13' },
  { id: 'H015', title: 'Batería Externa 20000mAh Carga Rápida PD', price: 249, currency: 'MXN', rating: 4.8, soldRange: '已售 5000件以上', store: 'Store_MLM_14' },
  { id: 'H016', title: 'Zapatillas Running Ultra Ligeras Transpirables', price: 399, currency: 'MXN', rating: 4.0, soldRange: '已售 5000件以上', store: 'Store_MLM_15' },
  { id: 'H017', title: 'Juego de Sábanas Microfibra Queen Size', price: 289, currency: 'MXN', rating: 4.2, soldRange: '已售 3件', store: 'Store_MLM_16' },
  { id: 'H018', title: 'Herramientas Multiusos 45 en 1 Acero Inox', price: 179, currency: 'MXN', rating: 4.4, soldRange: '已售 25-50件', store: 'Store_MLM_17' },
  { id: 'H019', title: 'Collar Personalizado con Nombre Acero Quirúrgico', price: 139, currency: 'MXN', rating: 4.6, soldRange: '已售 50-100件', store: 'Store_MLM_18' },
  { id: 'H020', title: 'Drone Mini con Cámara 4K Plegable GPS', price: 1599, currency: 'MXN', rating: 4.8, soldRange: '已售 150-200件', store: 'Store_MLM_19' },
];

export const mockTrends = [
  { keyword: 'iphone 15', rank: 1 }, { keyword: 'airpods pro', rank: 2 },
  { keyword: 'tenis nike', rank: 3 }, { keyword: 'funda samsung', rank: 4 },
  { keyword: 'smartwatch', rank: 5 }, { keyword: 'audifonos bluetooth', rank: 6 },
  { keyword: 'mochila', rank: 7 }, { keyword: 'lampara led', rank: 8 },
  { keyword: 'cargador rapido', rank: 9 }, { keyword: 'drone', rank: 10 },
  { keyword: 'bocina bluetooth', rank: 11 }, { keyword: 'teclado mecanico', rank: 12 },
  { keyword: 'proyector', rank: 13 }, { keyword: 'bateria externa', rank: 14 },
  { keyword: 'camara seguridad', rank: 15 }, { keyword: 'zapatillas running', rank: 16 },
  { keyword: 'organizador maquillaje', rank: 17 }, { keyword: 'collar personalizado', rank: 18 },
  { keyword: 'herramientas', rank: 19 }, { keyword: 'sabanas', rank: 20 },
  { keyword: 'funda airpods', rank: 21 }, { keyword: 'pantalla samsung', rank: 22 },
  { keyword: 'reloj apple', rank: 23 }, { keyword: 'correa apple watch', rank: 24 },
  { keyword: 'mouse inalambrico', rank: 25 }, { keyword: 'webcam hd', rank: 26 },
  { keyword: 'microfono usb', rank: 27 }, { keyword: 'ring light', rank: 28 },
  { keyword: 'tripe celular', rank: 29 }, { keyword: 'gimbal', rank: 30 },
  { keyword: 'consola juegos', rank: 31 }, { keyword: 'mando xbox', rank: 32 },
  { keyword: 'silla gamer', rank: 33 }, { keyword: 'escritorio', rank: 34 },
  { keyword: 'alfombra', rank: 35 }, { keyword: 'cortinas', rank: 36 },
  { keyword: 'toalla microfibra', rank: 37 }, { keyword: 'bolsa termica', rank: 38 },
  { keyword: 'vaso termico', rank: 39 }, { keyword: 'organizador closet', rank: 40 },
  { keyword: 'ganchos adhesivos', rank: 41 }, { keyword: 'bateria litio', rank: 42 },
  { keyword: 'panel solar', rank: 43 }, { keyword: 'bomba agua', rank: 44 },
  { keyword: 'aspiradora', rank: 45 }, { keyword: 'plancha ropa', rank: 46 },
  { keyword: 'secadora pelo', rank: 47 }, { keyword: 'maquina cortar pelo', rank: 48 },
  { keyword: 'cepillo electrico', rank: 49 }, { keyword: 'impresora', rank: 50 },
];

export const mockNotifications: Notification[] = [
  { id: 'N001', topic: 'orders_v2', resource: '/orders/12345', userId: 'U001', timestamp: '2024-01-15T10:30:00Z', site: 'MLM' },
  { id: 'N002', topic: 'items', resource: '/items/MLM123', userId: 'U001', timestamp: '2024-01-15T09:00:00Z', site: 'MLM' },
  { id: 'N003', topic: 'marketplace_orders', resource: '/orders/12346', userId: 'U001', timestamp: '2024-01-14T15:20:00Z', site: 'MLB' },
];

// In-memory notification storage (server-side)
let notificationStore: Notification[] = [...mockNotifications];

export function getNotifications(): Notification[] {
  return notificationStore;
}

export function addNotification(n: Notification): void {
  notificationStore.unshift(n);
  if (notificationStore.length > 200) {
    notificationStore = notificationStore.slice(0, 200);
  }
}

// Brand word database for infringement check
export const BRAND_WORDS = [
  'Nike', 'Adidas', 'Apple', 'Samsung', 'Huawei', 'Xiaomi', 'Sony', 'LG',
  'Gucci', 'Louis Vuitton', 'Chanel', 'Hermes', 'Prada', 'Dior', 'Versace',
  'Rolex', 'Omega', 'Cartier', 'Tiffany', 'Swarovski', 'Pandora',
  'Disney', 'Marvel', 'Pokemon', 'Hello Kitty', 'Sanrio', 'Lego',
  'Coca-Cola', 'Pepsi', 'Starbucks', 'McDonalds', 'KFC',
  'Dyson', 'Philips', 'Bosch', 'Siemens', 'Panasonic',
  'Puma', 'New Balance', 'Reebok', 'Under Armour', 'Skechers',
  'Zara', 'H&M', 'Uniqlo', 'Shein', 'Temu',
  'Anker', 'Baseus', 'Ugreen', 'Xiaomi', 'OnePlus',
  'JBL', 'Bose', 'Beats', 'Harman Kardon', 'Marshall',
  'Canon', 'Nikon', 'Fujifilm', 'GoPro', 'DJI',
  'Microsoft', 'Google', 'Amazon', 'Meta', 'Netflix',
];

export const COPYRIGHT_WORDS = [
  'Mickey Mouse', 'Spider-Man', 'Iron Man', 'Batman', 'Superman',
  'Pikachu', 'Pikachu', 'Goku', 'Naruto', 'Luffy',
  'Frozen', 'Elsa', 'Moana', 'Peppa Pig', 'Paw Patrol',
  'Harry Potter', 'Star Wars', 'Game of Thrones', 'Pokemon',
  'Hello Kitty', 'My Melody', 'Cinnamoroll', 'Kuromi',
  'Doraemon', 'SpongeBob', 'Pepe', 'Totoro',
];
