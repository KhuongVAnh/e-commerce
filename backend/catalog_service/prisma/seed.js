const path = require("path");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { buildDatabaseUrl, loadServiceEnv } = require("../../shared/db-url.cjs");

loadServiceEnv(path.resolve(__dirname, ".."), "catalog_service");

const adapter = new PrismaPg({
  connectionString: buildDatabaseUrl({ defaultSchema: "catalog_service", includeSearchPath: true }),
});
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { id: 2001n, name: "Điện tử", slug: "dien-tu", status: "ACTIVE" },
  { id: 2002n, name: "Thời trang", slug: "thoi-trang", status: "ACTIVE" },
  { id: 2003n, name: "Đồ gia dụng", slug: "do-gia-dung", status: "ACTIVE" },
  { id: 2004n, name: "Làm đẹp", slug: "lam-dep", status: "ACTIVE" },
  { id: 2005n, name: "Thể thao", slug: "the-thao", status: "ACTIVE" },
  { id: 2006n, name: "Sách & văn phòng phẩm", slug: "sach-van-phong-pham", status: "ACTIVE" },
  { id: 2007n, name: "Mẹ & bé", slug: "me-va-be", status: "ACTIVE" },
  { id: 2008n, name: "Thú cưng", slug: "thu-cung", status: "ACTIVE" },
  { id: 2009n, name: "Ô tô & xe máy", slug: "o-to-xe-may", status: "ACTIVE" },
  { id: 2010n, name: "Sức khỏe", slug: "suc-khoe", status: "ACTIVE" },
  { id: 2011n, name: "Thực phẩm & đồ uống", slug: "thuc-pham-do-uong", status: "ACTIVE" },
  { id: 2012n, name: "Nhà cửa & vườn", slug: "nha-cua-vuon", status: "ACTIVE" },
  { id: 2013n, name: "Phụ kiện mobile", slug: "phu-kien-mobile", status: "ACTIVE" },
  { id: 2014n, name: "Đồ chơi & giải trí", slug: "do-choi-giai-tri", status: "ACTIVE" },
  { id: 2015n, name: "Máy ảnh & phụ kiện", slug: "may-anh-phu-kien", status: "ACTIVE" },
];

const SHOPS = CATEGORIES.map((c, i) => ({
  id: BigInt(3001 + i),
  sellerId: BigInt(1101 + i),
  name: `Đại lý chính hãng ${c.name}`,
  slug: `dai-ly-chinh-hang-${c.slug}`,
  logoUrl: `https://loremflickr.com/300/300/logo,store,${c.slug}/all?lock=${3001 + i}`,
  address: `${10 + i} Nguyễn Huệ, Quận 1, TP.HCM`,
  description: `Cửa hàng chuyên phân phối chính hãng các sản phẩm ${c.name}. Cam kết chất lượng và bảo hành toàn quốc.`,
  status: "ACTIVE",
}));

const PRODUCT_DEFINITIONS = [
  {
    categorySlug: "dien-tu",
    shopId: 3001n,
    products: [
      ["Apple iPhone 15 Pro Max 256GB", "Màn hình 6.7 inch, chip A17 Pro, camera 48MP, thiết kế titan cao cấp.", 34990000, 100, ["iphone", "smartphone"]],
      ["Samsung Galaxy S24 Ultra 512GB", "AI tích hợp, bút S-Pen, camera 200MP zoom quang 5x, khung viền titan.", 33990000, 50, ["samsung", "smartphone"]],
      ["MacBook Pro 14 M3 2023", "Chip M3, RAM 8GB, SSD 512GB, màn hình Liquid Retina XDR.", 39990000, 30, ["macbook", "laptop"]],
      ["Laptop Dell XPS 15 9530", "Core i7-13700H, RAM 16GB, RTX 4050, màn hình OLED 3.5K.", 45990000, 20, ["dell", "laptop"]],
      ["Tai nghe Apple AirPods Pro 2", "Chống ồn chủ động ANC, hộp sạc MagSafe cổng Type-C.", 5990000, 200, ["airpods", "earbuds"]],
      ["Sony WH-1000XM5", "Tai nghe chụp tai chống ồn tốt nhất hiện nay, pin 30 giờ.", 7990000, 80, ["sony", "headphones"]],
      ["Apple Watch Series 9 41mm", "Màn hình sáng hơn, chip S9, tính năng Double Tap mới.", 9990000, 150, ["applewatch", "smartwatch"]],
      ["Samsung Galaxy Watch 6 Classic", "Viền xoay vật lý, theo dõi sức khỏe chuyên sâu, pin lâu.", 7590000, 120, ["galaxywatch", "smartwatch"]],
      ["iPad Air 5 10.9 inch M1", "Chip M1 mạnh mẽ, thiết kế mỏng nhẹ, hỗ trợ Apple Pencil 2.", 14990000, 90, ["ipad", "tablet"]],
      ["Bàn phím cơ Logitech G Pro X", "Bàn phím cơ dành cho game thủ, switch thay thế được.", 2990000, 60, ["keyboard", "gaming"]],
      ["Loa Bluetooth Marshall Acton III", "Thiết kế cổ điển, âm thanh chi tiết, kết nối Bluetooth 5.2.", 6990000, 40, ["marshall", "speaker"]],
      ["Màn hình máy tính Dell UltraSharp U2723QE", "Kích thước 27 inch, độ phân giải 4K, tấm nền IPS Black.", 12990000, 30, ["monitor", "dell"]],
      ["Chuột không dây Logitech MX Master 3S", "Chuột làm việc công thái học, cảm biến 8000 DPI, click siêu êm.", 2490000, 100, ["logitech", "mouse"]],
      ["Máy chiếu mini XGIMI MoGo 2", "Máy chiếu thông minh nhỏ gọn, độ phân giải 720p, loa kép 8W.", 8500000, 20, ["projector", "xgimi"]],
      ["Ổ cứng di động SSD Samsung T7 1TB", "Tốc độ đọc 1050MB/s, chống sốc, bảo mật vân tay.", 2890000, 80, ["ssd", "samsung"]],
      ["Cáp sạc Mophie USB-C to Lightning", "Cáp sạc nhanh 20W chuẩn MFi, bọc dù chống đứt.", 450000, 200, ["cable", "mophie"]],
      ["Tai nghe Sony WF-1000XM5", "Tai nghe True Wireless nhỏ gọn, chống ồn tốt nhất phân khúc.", 6490000, 50, ["earbuds", "sony"]],
      ["Máy chơi game PS5 Slim", "Thiết kế nhỏ gọn, dung lượng 1TB, trải nghiệm game 4K 120fps.", 13490000, 40, ["ps5", "playstation"]],
      ["Apple TV 4K 2022 128GB", "Thiết bị giải trí gia đình, chip A15 Bionic, hỗ trợ HDR10+.", 3990000, 60, ["appletv", "apple"]],
      ["Gimbal chống rung Zhiyun Smooth 5S", "Gimbal cho điện thoại, tích hợp đèn LED, chống rung 3 trục.", 3590000, 45, ["gimbal", "zhiyun"]]
    ]
  },
  {
    categorySlug: "thoi-trang",
    shopId: 3002n,
    products: [
      ["Áo thun nam Uniqlo AIRism", "Áo thun trơn cổ tròn, công nghệ làm mát AIRism.", 299000, 300, ["tshirt", "fashion"]],
      ["Quần Jeans Levi's 501 Original", "Quần jeans nam phom dáng cổ điển, vải denim cao cấp.", 1850000, 150, ["jeans", "levis"]],
      ["Áo sơ mi nam Owen Slim Fit", "Áo sơ mi công sở, vải mềm mịn, không nhăn.", 450000, 200, ["shirt", "menswear"]],
      ["Váy liền thân Zara hoa nhí", "Váy voan mùa hè nữ tính, họa tiết hoa nhí phong cách Hàn Quốc.", 899000, 100, ["dress", "zara"]],
      ["Áo khoác dạ nữ dáng dài", "Áo khoác dạ cao cấp phong cách thu đông, giữ ấm tốt.", 1200000, 80, ["coat", "winter"]],
      ["Giày Sneaker nam Nike Air Force 1", "Giày thể thao trắng basic, thiết kế trường tồn với thời gian.", 2650000, 120, ["nike", "sneaker"]],
      ["Giày cao gót nữ Charles & Keith", "Giày cao gót 7cm, da bóng, kiểu dáng thanh lịch sang trọng.", 1550000, 90, ["heels", "shoes"]],
      ["Túi xách tay nữ Pedro", "Túi xách da PU cao cấp, phom cứng cáp, phù hợp đi làm.", 1800000, 60, ["handbag", "pedro"]],
      ["Đồng hồ nam Casio Edifice", "Đồng hồ dây kim loại, mặt số thể thao, chống nước 100m.", 3500000, 40, ["watch", "casio"]],
      ["Kính mát Ray-Ban Aviator", "Kính râm phi công cổ điển, tròng kính phân cực chống UV.", 4200000, 50, ["sunglasses", "rayban"]],
      ["Áo sơ mi lụa tơ tằm nữ", "Chất liệu lụa tơ tằm tự nhiên, mềm mại, tôn dáng.", 1200000, 50, ["silk", "shirt"]],
      ["Quần âu nam công sở Việt Tiến", "Quần âu phom chuẩn, chất vải hạn chế nhăn, lịch sự.", 650000, 100, ["trousers", "menswear"]],
      ["Đầm dự tiệc dáng xòe", "Đầm thiết kế dáng xòe thanh lịch, đính hạt thủ công.", 1500000, 30, ["party", "dress"]],
      ["Áo len mỏng cardigan nữ", "Áo khoác len mỏng mùa thu, dễ phối đồ, phong cách Hàn Quốc.", 450000, 120, ["cardigan", "sweater"]],
      ["Giày lười nam da bò", "Giày lười (loafer) bằng da bò thật 100%, êm chân.", 1100000, 60, ["loafer", "shoes"]],
      ["Dép sandal nữ quai mảnh", "Dép sandal đi biển, quai mảnh điệu đà, dễ đi.", 350000, 80, ["sandal", "shoes"]],
      ["Balo da nữ mini", "Balo da PU chống thấm nước, kiểu dáng nhỏ gọn thời trang.", 550000, 90, ["backpack", "bag"]],
      ["Thắt lưng da nam khóa tự động", "Dây nịt da bò nguyên miếng, mặt khóa hợp kim không gỉ.", 400000, 150, ["belt", "leather"]],
      ["Nón kết lưỡi trai MLB", "Mũ lưỡi trai thêu logo NY nổi bật, form mũ cứng cáp.", 850000, 70, ["cap", "mlb"]],
      ["Ví da nam gập đôi mini", "Ví da sáp ngựa điên, thiết kế mỏng nhẹ, nhiều ngăn thẻ.", 350000, 200, ["wallet", "leather"]]
    ]
  },
  {
    categorySlug: "do-gia-dung",
    shopId: 3003n,
    products: [
      ["Nồi chiên không dầu Philips HD9252", "Dung tích 4.1L, công nghệ Rapid Air giảm 90% dầu mỡ.", 1990000, 150, ["airfryer", "kitchen"]],
      ["Robot hút bụi Roborock S8 Pro Ultra", "Tự động giặt giẻ, hút bụi mạnh mẽ 6000Pa, né vật cản 3D.", 22990000, 30, ["robotvacuum", "home"]],
      ["Máy lọc không khí Sharp FP-J40E-W", "Lọc bụi mịn PM2.5, khử mùi hôi và diệt vi khuẩn.", 3290000, 80, ["airpurifier", "appliance"]],
      ["Máy giặt LG Inverter 10kg", "Cửa trước, truyền động trực tiếp AI DD, giặt hơi nước.", 8990000, 50, ["washingmachine", "lg"]],
      ["Tủ lạnh Panasonic Inverter 322L", "Ngăn đông mềm diệt khuẩn, tiết kiệm điện năng chuẩn 5 sao.", 10500000, 40, ["refrigerator", "panasonic"]],
      ["Bếp từ đôi Sunhouse SHB9111MT", "Bếp từ lắp âm, mặt kính cường lực, công suất 3600W.", 2990000, 100, ["inductioncooker", "kitchen"]],
      ["Máy xay sinh tố Panasonic", "Cối thủy tinh 1.5L, lưỡi dao thép không gỉ, 2 tốc độ xay.", 1250000, 120, ["blender", "kitchen"]],
      ["Bàn ủi hơi nước đứng Philips", "Công suất 2000W, phun hơi liên tục, 3 mức điều chỉnh.", 2490000, 70, ["iron", "appliance"]],
      ["Máy sấy tóc Panasonic 2000W", "Công nghệ ion âm bảo vệ tóc, chế độ sấy mát.", 750000, 200, ["hairdryer", "home"]],
      ["Nồi cơm điện tử Toshiba 1.8L", "Lòng nồi chống dính dày, đa dạng chế độ nấu, giữ ấm 24h.", 1890000, 110, ["ricecooker", "kitchen"]],
      ["Máy rửa bát Bosch SMS6ZCI49E", "Sấy Zeolith, kết nối HomeConnect, rửa siêu êm.", 25900000, 15, ["dishwasher", "bosch"]],
      ["Lò vi sóng Sharp 20L", "Có chức năng rã đông, làm nóng nhanh, dễ sử dụng.", 1350000, 80, ["microwave", "sharp"]],
      ["Bếp hồng ngoại Sunhouse", "Phím cảm ứng, dùng được mọi loại nồi, khóa trẻ em.", 850000, 120, ["cooker", "sunhouse"]],
      ["Cây lau nhà thông minh 360 độ", "Bộ lau nhà tự vắt, bông lau microfiber siêu thấm.", 350000, 250, ["mop", "cleaning"]],
      ["Máy hút bụi cầm tay Dyson V12", "Hút bụi không dây cực mạnh, đầu hút gắn laser phát hiện bụi.", 15990000, 20, ["dyson", "vacuum"]],
      ["Nồi áp suất điện Philips 6L", "Đa chức năng: hầm, ninh, nấu cơm, màn hình hiển thị LED.", 2150000, 60, ["pressurecooker", "philips"]],
      ["Máy làm sữa hạt Unie V8S", "Chống ồn tốt, cối thủy tinh chịu nhiệt, nhiều chế độ xay nấu.", 2890000, 50, ["soybean", "maker"]],
      ["Quạt đứng Toshiba Inverter", "Quạt 7 cánh siêu êm, tiết kiệm điện, có remote.", 1450000, 100, ["fan", "toshiba"]],
      ["Bình đun siêu tốc Electrolux 1.7L", "Thép không gỉ 304 an toàn sức khỏe, ngắt điện tự động.", 550000, 150, ["kettle", "electrolux"]],
      ["Máy lọc nước RO Kangaroo 10 lõi", "Công nghệ diệt khuẩn Nano Silver, cung cấp khoáng chất.", 4500000, 40, ["waterpurifier", "kangaroo"]]
    ]
  },
  {
    categorySlug: "lam-dep",
    shopId: 3004n,
    products: [
      ["Son thỏi MAC Matte Lipstick", "Màu Ruby Woo đỏ cổ điển, chất son lì mịn không khô môi.", 650000, 300, ["lipstick", "mac"]],
      ["Nước hoa nữ Chanel Coco Mademoiselle", "Chai 100ml, hương thơm phương Đông quyến rũ, lưu hương lâu.", 4500000, 50, ["perfume", "chanel"]],
      ["Sữa rửa mặt CeraVe Hydrating Cleanser", "Dành cho da thường đến khô, làm sạch nhẹ dịu, phục hồi màng bảo vệ da.", 380000, 400, ["cleanser", "skincare"]],
      ["Kem chống nắng La Roche-Posay Anthelios", "SPF 50+ kiểm soát dầu, không bóng nhờn, phù hợp da nhạy cảm.", 485000, 350, ["sunscreen", "skincare"]],
      ["Serum Estee Lauder Advanced Night Repair", "Chai 50ml, phục hồi da ban đêm, chống lão hóa hiệu quả.", 3200000, 80, ["serum", "esteelauder"]],
      ["Nước tẩy trang Bioderma Sensibio", "Dung tích 500ml, tẩy sạch makeup nhẹ dịu cho da nhạy cảm.", 495000, 250, ["makeupremover", "skincare"]],
      ["Kem dưỡng ẩm Clinique Moisture Surge", "Cấp nước 100h, kết cấu gel-cream thấm nhanh, không bết rít.", 1200000, 100, ["moisturizer", "skincare"]],
      ["Mặt nạ đất sét Kiehl's Rare Earth", "Thu nhỏ lỗ chân lông, làm sạch sâu và giảm mụn đầu đen.", 950000, 90, ["facemask", "skincare"]],
      ["Phấn nước Laneige Neo Cushion", "Che phủ tốt, finish mịn lì, lâu trôi suốt 24h.", 850000, 150, ["cushion", "makeup"]],
      ["Dầu gội phục hồi Olaplex No.4", "Chai 250ml, phục hồi liên kết tóc bị hư tổn do hóa chất.", 750000, 120, ["shampoo", "haircare"]],
      ["Nước hoa hồng (Toner) Klairs", "Không cồn, cấp ẩm sâu, phù hợp da nhạy cảm. 150ml.", 285000, 200, ["toner", "skincare"]],
      ["Tẩy tế bào chết Paula's Choice 2% BHA", "Thu nhỏ lỗ chân lông, làm sạch mụn ẩn. 118ml.", 850000, 150, ["bha", "paulaschoice"]],
      ["Bảng phấn mắt 3CE Multi Eye Color", "Bảng 9 ô màu tone đất dễ đánh, chất phấn mịn lì.", 650000, 100, ["eyeshadow", "3ce"]],
      ["Chì kẻ mày Innisfree Auto Eyebrow", "Kẻ mày 2 đầu tiện dụng, nét thanh, lâu trôi.", 90000, 300, ["eyebrow", "innisfree"]],
      ["Nước hoa nam Dior Sauvage EDT", "Mùi hương nam tính, mạnh mẽ, độ tỏa hương xa. 100ml.", 3200000, 60, ["perfume", "dior"]],
      ["Sữa tắm dưỡng ẩm Dove Deep Moisture", "Bổ sung độ ẩm, giúp da mềm mịn sau khi tắm. 900g.", 185000, 250, ["bodywash", "dove"]],
      ["Lăn khử mùi Vichy Traitement", "Khử mùi tới 48h, không gây ố vàng áo, phù hợp da nhạy cảm.", 220000, 150, ["deodorant", "vichy"]],
      ["Mặt nạ giấy Mediheal N.M.F", "Mặt nạ cấp nước, giảm nếp nhăn, hộp 10 miếng.", 250000, 200, ["sheetmask", "mediheal"]],
      ["Dầu tẩy trang Kose Softymo Deep", "Chiết xuất dầu cám gạo làm sạch lớp makeup chống nước.", 195000, 180, ["cleansingoil", "kose"]],
      ["Xịt khoáng La Roche-Posay Thermal Spring", "Làm dịu da, giảm kích ứng, phù hợp mọi loại da. 300ml.", 320000, 120, ["facemist", "skincare"]]
    ]
  },
  {
    categorySlug: "the-thao",
    shopId: 3005n,
    products: [
      ["Giày chạy bộ nam Nike Pegasus 40", "Đệm React siêu êm, thân giày lưới thoáng khí, tối ưu cho chạy bộ.", 3200000, 100, ["nike", "runningshoes"]],
      ["Áo bóng đá Manchester United 23/24", "Áo đấu sân nhà chuẩn, thấm hút mồ hôi tốt, logo thêu sắc nét.", 1850000, 80, ["jersey", "football"]],
      ["Vợt cầu lông Yonex Astrox 99 Pro", "Vợt tấn công uy lực, dành cho người chơi khá giỏi.", 4500000, 40, ["badminton", "yonex"]],
      ["Quả bóng đá Adidas Oceaunz", "Bóng thi đấu chính thức, độ tròn hoàn hảo, bề mặt nhám.", 2500000, 60, ["football", "adidas"]],
      ["Thảm tập Yoga Liforme", "Độ bám dính cực tốt, có vạch định tuyến, chất liệu thân thiện môi trường.", 3800000, 50, ["yogamat", "yoga"]],
      ["Balo thể thao Under Armour", "Ngăn chứa rộng, chống nước nhẹ, có ngăn để giày riêng biệt.", 1200000, 150, ["backpack", "sports"]],
      ["Đai lưng tập tạ Valeo", "Hỗ trợ cột sống khi tập squat, deadlift, chất liệu da cao cấp.", 350000, 200, ["weightlifting", "gym"]],
      ["Bình nước thể thao CamelBak 1L", "Nhựa Tritan không chứa BPA, chống tràn, dễ dàng uống khi vận động.", 450000, 120, ["waterbottle", "sports"]],
      ["Kính bơi chống sương mù Speedo", "Góc nhìn rộng, chống tia UV, dây đeo silicon mềm mại.", 650000, 90, ["swim", "goggles"]],
      ["Dây nhảy tốc độ siêu nhẹ", "Dây cáp thép bọc nhựa, tay cầm nhôm có vòng bi xoay mượt mà.", 250000, 300, ["jumprope", "fitness"]],
      ["Balo chạy bộ tích hợp túi nước", "Balo phản quang, nhỏ gọn ôm sát cơ thể, kèm túi nước 2L.", 450000, 80, ["running", "backpack"]],
      ["Áo ngực thể thao nữ (Bra) cao cấp", "Nâng đỡ tốt, chất vải co giãn 4 chiều thoáng khí.", 250000, 150, ["sportsbra", "fitness"]],
      ["Quần tập gym nam 2 lớp", "Quần short có lót trong thấm hút mồ hôi, ngăn để điện thoại.", 180000, 200, ["gymshorts", "fitness"]],
      ["Dây ngũ sắc tập gym đa năng", "Bộ 5 dây kháng lực nhiều mức độ, kèm tay cầm và mỏ neo.", 220000, 150, ["resistancebands", "gym"]],
      ["Găng tay thủ môn Adidas Predator", "Độ bám dính bóng tốt, bảo vệ xương ngón tay.", 850000, 50, ["goalkeeper", "gloves"]],
      ["Kính xe đạp thể thao chống tia UV", "Tròng kính phân cực có thể thay thế, chống gió bụi.", 350000, 100, ["cycling", "glasses"]],
      ["Xe đạp địa hình Giant ATX", "Khung nhôm siêu nhẹ, phuộc nhún lò xo, phanh đĩa cơ.", 7500000, 20, ["bicycle", "giant"]],
      ["Con lăn tập bụng 4 bánh", "Tự động bật lại, thiết kế 4 bánh chống trượt vững chắc.", 200000, 120, ["abroller", "gym"]],
      ["Bộ tạ tay cao su 10kg có thể tháo rời", "Tạ lắp ghép tự do, chống gỉ, không làm xước sàn.", 650000, 60, ["dumbbells", "fitness"]],
      ["Gậy leo núi dã ngoại Naturehike", "Chất liệu hợp kim nhôm, gấp gọn nhẹ, giảm xóc tốt.", 320000, 90, ["trekkingpole", "naturehike"]]
    ]
  },
  {
    categorySlug: "sach-van-phong-pham",
    shopId: 3006n,
    products: [
      ["Sách Đắc Nhân Tâm - Dale Carnegie", "Quyển sách self-help kinh điển về nghệ thuật giao tiếp và thu phục lòng người.", 85000, 500, ["book", "reading"]],
      ["Sách Nhà Giả Kim - Paulo Coelho", "Cuốn tiểu thuyết truyền cảm hứng về hành trình theo đuổi ước mơ.", 70000, 400, ["book", "fiction"]],
      ["Bộ sách Harry Potter (7 tập)", "Trọn bộ tiểu thuyết phép thuật của J.K. Rowling, bản tiếng Việt mới nhất.", 1200000, 50, ["book", "harrypotter"]],
      ["Sổ tay Moleskine Classic Notebook", "Sổ tay cao cấp, giấy màu ngà, chống lóa mắt, có dây chun giữ sổ.", 550000, 100, ["notebook", "stationery"]],
      ["Bút máy Lamy Safari", "Ngòi bút êm trơn, thiết kế công thái học, chất liệu nhựa ABS bền bỉ.", 650000, 80, ["pen", "lamy"]],
      ["Hộp bút bi Thiên Long TL-027 (20 cây)", "Bút bi quốc dân, mực ra đều, nét chữ thanh mảnh.", 60000, 1000, ["pen", "stationery"]],
      ["Giấy in Double A A4 80gsm", "Ram 500 tờ, giấy trắng sáng, mịn, không kẹt máy in.", 95000, 600, ["paper", "office"]],
      ["Balo chống gù Randoseru Nhật Bản", "Balo học sinh tiểu học, bảo vệ cột sống, siêu nhẹ và bền.", 3500000, 30, ["backpack", "school"]],
      ["Bút dạ quang Stabilo Boss (Bộ 4 màu)", "Màu mực sáng, lâu phai, không bị thấm sang trang sau.", 120000, 200, ["highlighter", "stationery"]],
      ["Bộ màu nước Koi Sakura 24 màu", "Màu nước dạng nén nhỏ gọn, kèm cọ nước tiện dụng cho người thích vẽ.", 450000, 120, ["watercolor", "art"]],
      ["Sách Lược Sử Loài Người - Yuval Noah Harari", "Sách best seller về tiến trình phát triển của loài người.", 155000, 200, ["book", "history"]],
      ["Truyện Tranh Doraemon - Trọn bộ 45 tập", "Bộ truyện tranh gắn liền với tuổi thơ của mọi thế hệ.", 810000, 50, ["manga", "doraemon"]],
      ["Máy tính cầm tay Casio FX-580VN X", "Phiên bản chuẩn thi THPT quốc gia, tốc độ xử lý nhanh.", 680000, 100, ["calculator", "casio"]],
      ["Sổ còng B5 Caro Klong", "Sổ gáy còng dễ dàng thay giấy, định lượng giấy 120gsm.", 85000, 250, ["notebook", "klong"]],
      ["Kẹp bướm đục lỗ Deli (Hộp 12 cái)", "Kẹp tài liệu chắc chắn, không bị rỉ sét.", 25000, 500, ["binderclip", "stationery"]],
      ["Băng keo trong 5cm (Lốc 6 cuộn)", "Độ dính cao, dùng đóng gói hàng hóa chắc chắn.", 65000, 300, ["tap", "office"]],
      ["Bộ thước eke kim loại WinQ", "Thước góc, thước thẳng đo chính xác, số rõ nét.", 45000, 200, ["ruler", "stationery"]],
      ["Bảng viết phấn đen có chân chữ A", "Dùng cho quán cafe, tiệm bánh, dễ dàng trang trí.", 450000, 40, ["chalkboard", "cafe"]],
      ["Túi đựng bút trong suốt Hàn Quốc", "Thiết kế chống nước, sức chứa lớn để vừa máy tính bỏ túi.", 50000, 300, ["pencilcase", "stationery"]],
      ["Ghế xoay văn phòng Hòa Phát", "Lưng lưới thoáng khí, nệm ngồi êm ái, chân nhựa đúc.", 750000, 50, ["officechair", "furniture"]]
    ]
  },
  {
    categorySlug: "me-va-be",
    shopId: 3007n,
    products: [
      ["Sữa bột Meiji số 0 (0-1 tuổi) 800g", "Sữa nội địa Nhật, bổ sung DHA, mát và giúp bé phát triển toàn diện.", 580000, 200, ["babymilk", "meiji"]],
      ["Tã quần Huggies Platinum siêu mỏng (Size L)", "Thấm hút nhanh, bề mặt mềm mại, không gây hăm tã.", 350000, 300, ["diaper", "baby"]],
      ["Xe đẩy em bé Aprica Karoon", "Siêu nhẹ 3.6kg, gấp gọn 1 tay, đệm lót êm ái thoáng khí.", 5500000, 20, ["stroller", "baby"]],
      ["Bình sữa Pigeon thần thánh 160ml", "Bình PPSU cao cấp, núm ti siêu mềm mô phỏng ti mẹ.", 320000, 150, ["babybottle", "pigeon"]],
      ["Máy hút sữa điện đôi Medela Freestyle", "Lực hút mạnh, êm ái, pin sạc tiện lợi, có túi bảo quản sữa.", 7500000, 15, ["breastpump", "mother"]],
      ["Nôi cũi gỗ sồi đa năng cho bé", "Gỗ sồi tự nhiên không sơn độc hại, 3 mức nâng hạ độ cao.", 2800000, 25, ["crib", "baby"]],
      ["Ghế ăn dặm Hanbei điều chỉnh độ cao", "Nhựa ABS an toàn, dễ vệ sinh, có thể làm ghế bệt hoặc ghế cao.", 450000, 100, ["highchair", "baby"]],
      ["Kem chống hăm Sudocrem 60g", "Bảo vệ và làm dịu vùng da bị hăm tã, trị vết côn trùng cắn.", 120000, 400, ["sudocrem", "babycare"]],
      ["Nước giặt xả Dnee Thái Lan 3000ml", "Hương thơm dịu nhẹ, an toàn cho làn da nhạy cảm của bé.", 180000, 500, ["laundry", "baby"]],
      ["Địu em bé Ergobaby Omni 360", "Địu 4 tư thế, phân tán lực giúp ba mẹ không bị mỏi vai lưng.", 3200000, 30, ["babycarrier", "mother"]],
      ["Sữa bầu Morinaga vị trà sữa 216g", "Sữa tốt cho mẹ, vào con không vào mẹ, dễ uống.", 250000, 150, ["pregnant", "milk"]],
      ["Nhiệt kế ẩm kế phòng em bé Tanita", "Đo độ ẩm và nhiệt độ phòng, cảnh báo nguy cơ khô da.", 350000, 80, ["hygrometer", "baby"]],
      ["Bát ăn dặm chống lật Silicon sợi tre", "Hít chặt vào bàn, chất liệu an toàn BPA Free.", 120000, 200, ["babybowl", "feeding"]],
      ["Gối chống trào ngược cho bé sơ sinh", "Gốc nghiêng 15 độ khoa học, hỗ trợ hệ tiêu hóa của bé.", 280000, 100, ["babypillow", "baby"]],
      ["Nước muối sinh lý Physiodose Pháp (40 ống)", "Vệ sinh mắt, mũi cho trẻ sơ sinh và trẻ nhỏ an toàn.", 150000, 300, ["saline", "babycare"]],
      ["Dầu tràm trà Huế nguyên chất", "Phòng cảm lạnh, trị vết muỗi cắn cho bé. 100ml.", 150000, 150, ["essentialoil", "babycare"]],
      ["Miếng lót phân su Mama (Gói 30 miếng)", "Thấm hút tốt, tiện dụng cho bé sơ sinh trong tháng đầu.", 60000, 400, ["babypad", "diaper"]],
      ["Chậu tắm cho bé gấp gọn hình gấu", "Có lưới tắm kèm nhiệt kế đo nước tự động.", 320000, 90, ["babybath", "baby"]],
      ["Sách vải kích thích thị giác trắng đen", "Giúp bé phát triển não bộ và thị giác trong giai đoạn 0-6 tháng.", 85000, 200, ["clothbook", "toy"]],
      ["Cốc tập uống nước Richell 3 giai đoạn", "Nắp chống sặc, chất liệu nhựa an toàn PPSU.", 290000, 120, ["babycup", "feeding"]]
    ]
  },
  {
    categorySlug: "thu-cung",
    shopId: 3008n,
    products: [
      ["Thức ăn cho chó trưởng thành Pedigree 3kg", "Vị bò nướng và rau củ, cung cấp đầy đủ dinh dưỡng.", 220000, 200, ["dogfood", "pet"]],
      ["Hạt Royal Canin Kitten cho mèo con 2kg", "Hỗ trợ tiêu hóa, tăng cường hệ miễn dịch cho mèo dưới 12 tháng.", 450000, 150, ["catfood", "royalcanin"]],
      ["Cát vệ sinh cho mèo Bentonite 8L", "Vón cục nhanh, khử mùi tốt, ít bụi an toàn cho hô hấp.", 85000, 500, ["catlitter", "pet"]],
      ["Pate Whiskas vị cá ngừ hộp 85g", "Thơm ngon, kích thích vị giác, bổ sung nước cho mèo.", 15000, 1000, ["pate", "cat"]],
      ["Vòng cổ trị rận cho chó mèo Bioline", "Tinh dầu tự nhiên xua đuổi ve rận, an toàn và hiệu quả kéo dài 4 tháng.", 120000, 300, ["petcollar", "pet"]],
      ["Sữa tắm SOS cho chó lông trắng 530ml", "Làm sạch sâu, giữ màu lông sáng bóng, hương thơm lưu lâu.", 150000, 180, ["petshampoo", "dog"]],
      ["Balo phi hành gia vận chuyển chó mèo", "Mặt nhựa trong suốt có lỗ thông gió, đệm lót êm ái.", 250000, 120, ["petbackpack", "cat"]],
      ["Đồ chơi cần câu mèo có lông vũ", "Kích thích bản năng săn mồi, giúp mèo vận động xả stress.", 35000, 400, ["cattoy", "pet"]],
      ["Bát ăn đôi inox chống lật cho chó mèo", "Khay nhựa PP đế cao su chống trượt, 2 bát inox dễ rửa.", 95000, 250, ["petbowl", "pet"]],
      ["Nhà cây (Cat Tree) cào móng cho mèo", "Cột quấn dây thừng sisal dày dặn, có võng ngủ êm ái.", 650000, 40, ["cattree", "pet"]],
      ["Khay vệ sinh cho mèo có thành cao", "Kích thước lớn, ngăn cát văng ra ngoài, tặng kèm xẻng.", 150000, 200, ["litterbox", "cat"]],
      ["Súp thưởng Ciao Churu vị cá ngừ", "Đồ ăn vặt dinh dưỡng, tăng cường nước cho mèo.", 45000, 500, ["catsnack", "pet"]],
      ["Đệm ngủ cho chó mèo hình tròn", "Chất liệu lông cừu ấm áp, giặt được máy.", 180000, 150, ["petbed", "pet"]],
      ["Xịt khử mùi phân tiểu thú cưng 500ml", "Phân hủy mùi hôi sinh học, diệt khuẩn 99%.", 120000, 250, ["petdeodorizer", "pet"]],
      ["Tông đơ cắt lông chó mèo Codos", "Lưỡi cắt an toàn không xước da, pin sạc dùng 2h.", 450000, 80, ["petclipper", "grooming"]],
      ["Áo len cho chó mèo mùa đông", "Giữ ấm, dễ mặc, nhiều kích cỡ từ S đến XXL.", 85000, 300, ["petclothes", "dog"]],
      ["Dây dắt chó kèm yếm ngực phản quang", "Giảm lực kéo vào cổ chó, phản quang an toàn khi đi đêm.", 150000, 180, ["petharness", "dog"]],
      ["Đồ chơi bóng thừng gặm sạch răng", "Chất liệu cotton bền bỉ, giúp chó nhai gặm đỡ buồn chán.", 45000, 400, ["dogtoy", "pet"]],
      ["Bánh thưởng cho chó Pedigree Dentastix", "Hỗ trợ làm sạch mảng bám, giảm hôi miệng.", 55000, 300, ["dogtreat", "pet"]],
      ["Cỏ mèo tươi giúp tiêu búi lông", "Trồng trong hộp sẵn, 5 ngày mọc nhanh, giúp tiêu hóa tốt.", 25000, 500, ["catgrass", "pet"]]
    ]
  },
  {
    categorySlug: "o-to-xe-may",
    shopId: 3009n,
    products: [
      ["Nhớt Motul 300V 10W40 1L", "Nhớt tổng hợp toàn phần nhập khẩu Pháp, tốt nhất cho xe máy.", 420000, 150, ["motoroil", "motul"]],
      ["Mũ bảo hiểm fullface Royal M136", "Vỏ nhựa ABS nguyên sinh, kính chắn gió chống trầy xước.", 550000, 100, ["helmet", "motorcycle"]],
      ["Camera hành trình 70mai Dash Cam A500S", "Ghi hình 2.7K sắc nét, tích hợp GPS, cảnh báo ADAS.", 1890000, 80, ["dashcam", "car"]],
      ["Bơm lốp ô tô mini Xiaomi 1S", "Bơm điện tự động ngắt, nhỏ gọn tiện mang theo xe.", 950000, 120, ["airpump", "car"]],
      ["Nước hoa ô tô Areon dạng sáp", "Hương cà phê khử mùi hiệu quả, lưu hương lên đến 2 tháng.", 220000, 300, ["carperfume", "car"]],
      ["Gương chiếu hậu xe máy rizoma", "Chất liệu nhôm CNC nguyên khối, mặt kính chống chói.", 350000, 200, ["mirror", "motorcycle"]],
      ["Bọc vô lăng ô tô Sparco chính hãng", "Da PU cao cấp, bám tay chống trượt, thiết kế thể thao.", 450000, 150, ["steeringwheel", "car"]],
      ["Dung dịch rửa xe Sonax Gloss Shampoo 1L", "Rửa sạch bụi bẩn, bảo vệ màu sơn, siêu đậm đặc.", 180000, 250, ["carwash", "sonax"]],
      ["Giá đỡ điện thoại xe máy Baseus", "Hợp kim nhôm chắc chắn, khóa tự động giữ điện thoại an toàn.", 280000, 180, ["phoneholder", "motorcycle"]],
      ["Lốp xe máy Michelin City Grip Pro", "Bám đường ướt cực tốt, chống đinh hiệu quả, độ bền cao.", 850000, 60, ["tire", "michelin"]],
      ["Mũ bảo hiểm 3/4 Napoli có kính", "Lớp đệm dày, kính chống chói ban đêm và tia UV ban ngày.", 250000, 150, ["helmet", "motorcycle"]],
      ["Áo mưa bộ cao cấp Givi", "Chất liệu dù siêu bền, chống thấm 100%, có phản quang.", 650000, 100, ["raincoat", "motorcycle"]],
      ["Khóa chữ U chống trộm xe máy Việt Tiệp", "Lõi khóa đúc khối, chống cắt, chống cưa.", 180000, 200, ["padlock", "motorcycle"]],
      ["Thảm lót sàn ô tô 6D may đo", "Chống bẩn, chống thấm nước, dễ vệ sinh, vừa form xe.", 1500000, 50, ["carmat", "car"]],
      ["Bạt phủ ô tô tráng nhôm cách nhiệt", "Chống nắng nóng gắt, bảo vệ nội thất và màu sơn.", 450000, 120, ["carcover", "car"]],
      ["Gạt mưa ô tô Bosch Advantage (1 cặp)", "Lưỡi cao su Graphite gạt sạch nước, không để lại vệt.", 250000, 180, ["wiper", "car"]],
      ["Cảm biến áp suất lốp ô tô TPMS", "Hiển thị áp suất và nhiệt độ 4 lốp, dùng pin năng lượng mặt trời.", 750000, 80, ["tpms", "car"]],
      ["Máy hút bụi ô tô cầm tay có dây 12V", "Cắm tẩu sạc, lực hút mạnh 120W, kèm đầu hút khe.", 220000, 200, ["carvacuum", "car"]],
      ["Nước làm mát động cơ Liqui Moly đỏ 1L", "Tản nhiệt tốt, chống sôi nước, dùng trực tiếp không cần pha.", 180000, 150, ["coolant", "car"]],
      ["Dung dịch súc rửa kim phun xăng xe máy", "Làm sạch buồng đốt, tiết kiệm nhiên liệu, máy bốc hơn.", 65000, 300, ["fuelcleaner", "motorcycle"]]
    ]
  },
  {
    categorySlug: "suc-khoe",
    shopId: 3010n,
    products: [
      ["Viên uống Vitamin C Blackmores 1000mg", "Tăng cường sức đề kháng, hỗ trợ làm sáng da. Hộp 150 viên.", 450000, 200, ["vitaminc", "health"]],
      ["Dầu cá Omega 3 Healthy Care 1000mg", "Bổ mắt, tốt cho tim mạch và não bộ. Hộp 400 viên.", 550000, 150, ["omega3", "health"]],
      ["Máy đo huyết áp điện tử bắp tay Omron", "Đo chính xác, bộ nhớ lưu 60 kết quả, báo lỗi nhịp tim.", 1150000, 100, ["bloodpressure", "health"]],
      ["Khẩu trang y tế 4 lớp kháng khuẩn (Hộp 50 cái)", "Vải không dệt lọc bụi mịn, dây thun mềm không đau tai.", 45000, 1000, ["mask", "health"]],
      ["Nhiệt kế hồng ngoại đo trán Microlife", "Đo nhanh trong 1 giây, độ chính xác cao, đo được nhiệt độ nước/sữa.", 750000, 80, ["thermometer", "health"]],
      ["Đông trùng hạ thảo sấy thăng hoa 10g", "Bồi bổ sức khỏe, giảm mệt mỏi, hỗ trợ chức năng phổi.", 850000, 50, ["cordyceps", "health"]],
      ["Sụn vi cá mập Costar Shark Cartilage", "Hỗ trợ điều trị xương khớp, giảm đau nhức. Hộp 365 viên.", 680000, 120, ["jointcare", "health"]],
      ["Yến sào tinh chế loại 1 (Hộp 50g)", "Tổ yến thật 100%, bổ sung dinh dưỡng cho người ốm, người già.", 2200000, 30, ["birdnest", "health"]],
      ["Cao hồng sâm Hàn Quốc Cheong Kwan Jang", "Giúp tỉnh táo, giảm căng thẳng, tăng cường thể lực.", 1500000, 40, ["ginseng", "health"]],
      ["Bàn chải điện Oral-B Vitality", "Làm sạch mảng bám hiệu quả hơn 100% so với bàn chải thường.", 650000, 150, ["toothbrush", "health"]],
      ["Men vi sinh Optibac Probiotics Tím", "Hỗ trợ phụ khoa, cân bằng hệ vi sinh. Hộp 30 viên.", 420000, 150, ["probiotics", "health"]],
      ["Viên uống hỗ trợ xương khớp Glucosamine Kirkland", "Giảm đau mỏi khớp, hộp 375 viên dùng lâu dài.", 580000, 120, ["glucosamine", "health"]],
      ["Máy massage cổ vai gáy Xiaomi", "Massage xung điện, tỏa nhiệt làm ấm, giảm căng cơ.", 650000, 90, ["massager", "health"]],
      ["Cồn sát trùng 70 độ Vĩnh Phúc 500ml", "Sát khuẩn vết thương, vệ sinh tay và đồ vật.", 25000, 500, ["alcohol", "health"]],
      ["Băng gạc cá nhân Urgo (Hộp 100 miếng)", "Thoáng khí, chống thấm nước, dễ bóc không đau.", 45000, 400, ["bandage", "health"]],
      ["Máy hút mũi cho bé sơ sinh tự động", "Lực hút nhẹ nhàng, có phát nhạc dỗ dành bé.", 250000, 100, ["nasalaspirator", "babycare"]],
      ["Túi chườm nóng lạnh y tế cỡ lớn", "Giảm đau bụng kinh, chườm giảm sưng tấy chấn thương.", 85000, 250, ["hotwaterbottle", "health"]],
      ["Vitamin tổng hợp Centrum Adults", "Bổ bổ vitamin, khoáng chất thiết yếu cho người lớn. Hộp 365 viên.", 650000, 80, ["multivitamin", "health"]],
      ["Trà thảo mộc an thần dễ ngủ", "Thành phần tâm sen, lạc tiên, hoa cúc giúp ngủ ngon.", 150000, 200, ["herbaltea", "health"]],
      ["Bồn ngâm chân massage sục khí tự làm nóng", "Giải trừ mệt mỏi, lưu thông khí huyết, màn hình LED.", 750000, 60, ["footspa", "health"]]
    ]
  },
  {
    categorySlug: "thuc-pham-do-uong",
    shopId: 3011n,
    products: [
      ["Cà phê rang xay Trung Nguyên Sáng Tạo 5", "Vị đắng êm, hương thơm đặc trưng của cà phê Culi Arabica.", 120000, 300, ["coffee", "drink"]],
      ["Bánh xốp phô mai Nabati 320g", "Lớp phô mai béo ngậy xen kẽ vỏ bánh xốp giòn tan.", 45000, 500, ["snack", "food"]],
      ["Trà Ô Long Tâm Châu lon 200g", "Trà viên tròn đậm vị, nước màu vàng xanh, hương thơm tự nhiên.", 150000, 200, ["tea", "drink"]],
      ["Sữa tươi tiệt trùng TH True Milk (Thùng 48 hộp)", "Sữa tươi nguyên chất 100% từ trang trại TH.", 360000, 150, ["milk", "drink"]],
      ["Mật ong rừng nguyên chất hoa tràm 1L", "Vị ngọt dịu, tốt cho tiêu hóa và làm dịu cổ họng.", 250000, 100, ["honey", "food"]],
      ["Hạt điều rang muối Bình Phước 500g", "Hạt loại 1 to đều, rang củi giòn rụm, vị mặn vừa phải.", 180000, 250, ["cashew", "food"]],
      ["Bò khô miếng Tây Nguyên 500g", "Thịt bò tươi ướp gia vị đậm đà, sấy khô tự nhiên.", 350000, 120, ["beefjerky", "food"]],
      ["Nước mắm cá cơm Nam Ngư chai 750ml", "Vị ngon hài hòa, dùng chấm trực tiếp hoặc nêm nếm.", 48000, 400, ["fishsauce", "food"]],
      ["Gạo ST25 Sóc Trăng bao 5kg", "Gạo ngon nhất thế giới, hạt dài, dẻo thơm ngay cả khi để nguội.", 190000, 300, ["rice", "food"]],
      ["Socola Ferrero Rocher hộp 16 viên", "Socola bọc hạt dẻ cười cao cấp, món quà ngọt ngào sang trọng.", 280000, 150, ["chocolate", "food"]],
      ["Nước ngọt Coca-Cola thùng 24 lon 320ml", "Nước giải khát có ga, sảng khoái mát lạnh.", 220000, 200, ["cocacola", "drink"]],
      ["Mì Hảo Hảo Tôm Chua Cay thùng 30 gói", "Hương vị quốc dân, sợi mì dai ngon, nước súp đậm đà.", 115000, 300, ["noodles", "food"]],
      ["Sữa chua Vinamilk có đường lốc 4 hộp", "Lên men tự nhiên, tốt cho tiêu hóa, tăng cường đề kháng.", 28000, 400, ["yogurt", "food"]],
      ["Rượu vang đỏ Chile Casillero del Diablo", "Vang đỏ chát nhẹ, thoảng hương cherry và mận đen. 750ml.", 450000, 50, ["wine", "drink"]],
      ["Bia Heineken lon cao thùng 24 x 330ml", "Bia nhập khẩu, vị lúa mạch êm dịu, chất lượng tuyệt hảo.", 430000, 100, ["beer", "drink"]],
      ["Nước yến sào Sanest Khánh Hòa hộp 6 lọ", "Dinh dưỡng cao cấp, bồi bổ cơ thể, không đường hóa học.", 210000, 150, ["birdnest", "drink"]],
      ["Rong biển rang mè Hàn Quốc gói 50g", "Snack rong biển giòn rụm, mặn mặn ngọt ngọt cực cuốn.", 45000, 250, ["seaweed", "snack"]],
      ["Lạp xưởng Mai Quế Lộ Vissan túi 500g", "Tỉ lệ nạc mỡ hoàn hảo, thơm mùi rượu Mai Quế Lộ truyền thống.", 160000, 120, ["sausage", "food"]],
      ["Xúc xích tiệt trùng Ponnie lắc phô mai", "Thịt lợn sạch, kèm gói bột phô mai lắc béo ngậy.", 35000, 300, ["sausage", "snack"]],
      ["Ngũ cốc dinh dưỡng Calbee Nhật 700g", "Hạt yến mạch sấy giòn mix trái cây khô, ăn sáng tiện lợi.", 185000, 200, ["cereal", "food"]]
    ]
  },
  {
    categorySlug: "nha-cua-vuon",
    shopId: 3012n,
    products: [
      ["Đèn năng lượng mặt trời chống nước 100W", "Tự động sáng khi trời tối, tấm pin năng lượng hấp thụ tốt.", 450000, 150, ["solarlight", "garden"]],
      ["Bộ cuộn ống tưới cây tự động 15m", "Vòi phun nhiều chế độ, thu dây tự động gọn gàng.", 550000, 80, ["hose", "garden"]],
      ["Chậu composite giả đá trồng cây cao cấp", "Nhẹ, siêu bền, chịu thời tiết ngoài trời tốt.", 350000, 120, ["planter", "garden"]],
      ["Hạt giống hoa hồng leo Pháp (Gói 50 hạt)", "Tỉ lệ nảy mầm cao, ra hoa quanh năm, bông to nhiều lớp.", 50000, 300, ["seeds", "garden"]],
      ["Kéo cắt cành mũi nhọn thép SK5 Nhật", "Cắt ngọt, sắc bén, có lò xo trợ lực và khóa an toàn.", 150000, 200, ["secateurs", "garden"]],
      ["Bình xịt tưới cây áp suất 2 lít", "Chất liệu nhựa PE dày dặn, béc phun đồng chỉnh tia nhuyễn.", 85000, 250, ["sprayer", "garden"]],
      ["Đất sạch Namix trồng rau và hoa (Bao 20dm3)", "Phối trộn sẵn xơ dừa, phân hữu cơ, tơi xốp rễ phát triển tốt.", 70000, 400, ["soil", "garden"]],
      ["Giàn leo hoa bằng ống thép bọc nhựa", "Dễ lắp ráp, không gỉ sét, thích hợp cho hồng leo, hoa thiên lý.", 280000, 100, ["trellis", "garden"]],
      ["Bộ dụng cụ làm vườn mini 3 món", "Xẻng, cào, xới đất cán gỗ nhỏ gọn dùng cho chậu cây cảnh.", 45000, 500, ["gardentools", "garden"]],
      ["Phân bón lá NPK kích ra hoa", "Bổ sung vi lượng giúp hoa nở to, màu sắc rực rỡ và lâu tàn.", 35000, 350, ["fertilizer", "garden"]],
      ["Máy khoan cầm tay Makita 13mm", "Công suất 710W, có búa khoan tường nhẹ, kèm bộ mũi khoan.", 1250000, 80, ["drill", "tools"]],
      ["Bộ tua vít đa năng 45 in 1", "Đầy đủ đầu vít tháo lắp điện thoại, laptop, thiết bị điện.", 150000, 250, ["screwdriver", "tools"]],
      ["Ổ cắm điện đa năng Lioa 6 lỗ", "Dây dài 3m, có công tắc riêng biệt, chống quá tải.", 120000, 300, ["powerstrip", "home"]],
      ["Chậu nhựa trồng rau thông minh", "Có lưới chống úng nước, nhựa PP nguyên sinh bền bỉ.", 55000, 400, ["planter", "garden"]],
      ["Cây bàng Singapore giả trang trí", "Cao 1m2, lá phủ bóng như thật, kèm chậu nhựa trắng.", 450000, 100, ["artificialplant", "decor"]],
      ["Giấy dán tường Hàn Quốc 10m", "Họa tiết vân trơn, chống ẩm mốc, sẵn keo mặt sau.", 250000, 150, ["wallpaper", "home"]],
      ["Gương soi toàn thân viền viền gỗ", "Kích thước 1m6 x 50cm, kính Bỉ nịnh dáng, chống vỡ vụn.", 650000, 60, ["mirror", "decor"]],
      ["Hộp đựng giày nhựa cứng trong suốt lắp ráp", "Bảo quản giày chống bụi, xếp chồng chắc chắn.", 35000, 500, ["shoebox", "storage"]],
      ["Thảm trải sàn nỉ nhung phòng khách", "Họa tiết Bắc Âu sang trọng, mặt dưới chống trượt.", 350000, 120, ["rug", "decor"]],
      ["Khóa cửa vân tay thông minh Xiaomi", "Tích hợp thẻ từ, mật khẩu, vân tay sinh trắc học siêu nhạy.", 3500000, 30, ["smartlock", "home"]]
    ]
  },
  {
    categorySlug: "phu-kien-mobile",
    shopId: 3013n,
    products: [
      ["Cáp sạc nhanh Anker PowerLine III USB-C to Lightning", "Chứng nhận MFi, sạc nhanh 20W, độ bền gập xoắn siêu cao.", 350000, 300, ["cable", "anker"]],
      ["Pin sạc dự phòng Xiaomi 20000mAh Gen 3", "Hỗ trợ sạc nhanh 18W 2 chiều, thiết kế vỏ nhựa nhám.", 550000, 200, ["powerbank", "xiaomi"]],
      ["Củ sạc Baseus GaN3 Pro 65W", "Công nghệ GaN nhỏ gọn, 3 cổng sạc (2 Type-C, 1 USB-A) sạc được laptop.", 650000, 150, ["charger", "baseus"]],
      ["Ốp lưng iPhone 15 Pro Max Spigen Ultra Hybrid", "Viền dẻo TPU, mặt lưng PC cứng trong suốt không ố vàng.", 450000, 250, ["phonecase", "spigen"]],
      ["Kính cường lực Nillkin Amazing CP+ Pro", "Phủ nano chống bám vân tay, độ cứng 9H, viền đen cong 2.5D.", 220000, 400, ["screenprotector", "nillkin"]],
      ["Giá đỡ điện thoại để bàn Ugreen", "Hợp kim nhôm nguyên khối, gập gọn linh hoạt, đệm silicon chống trượt.", 180000, 300, ["phoneholder", "ugreen"]],
      ["Tai nghe có dây EarPods cổng Lightning", "Tai nghe chính hãng Apple, âm thanh trung thực, bass sâu.", 490000, 150, ["earpods", "apple"]],
      ["Đầu chuyển đổi Type-C sang 3.5mm", "DAC giải mã âm thanh tốt, tương thích Samsung, iPad.", 150000, 350, ["dongle", "audio"]],
      ["Sạc không dây MagSafe chính hãng Apple", "Sạc từ tính 15W, hít chặt vào mặt lưng iPhone 12 trở lên.", 1150000, 100, ["magsafe", "apple"]],
      ["Gậy chụp hình Tripod Bluetooth Yunteng", "Chân máy 3 chân chắc chắn, có remote bấm chụp từ xa.", 250000, 200, ["tripod", "selfie"]],
      ["AirTag định vị chính hãng Apple", "Tìm chìa khóa, balo dễ dàng qua app Find My.", 750000, 150, ["airtag", "apple"]],
      ["Bút cảm ứng Apple Pencil 2", "Độ trễ thấp, sạc nam châm hít cạnh iPad Pro/Air.", 2990000, 80, ["applepencil", "ipad"]],
      ["Cáp sạc Samsung Type-C to Type-C 25W", "Cáp zin bóc máy, hỗ trợ Super Fast Charging.", 150000, 250, ["cable", "samsung"]],
      ["Bao da iPad Pro 11 inch Smart Folio", "Bảo vệ 2 mặt, tự động tắt mở màn hình, gập làm chân đế.", 450000, 120, ["ipadcase", "apple"]],
      ["Tai nghe Bluetooth Baseus Bowie EZ10", "Tai nghe không dây giá rẻ, pin 25h, Bluetooth 5.3.", 250000, 300, ["earbuds", "baseus"]],
      ["Miếng dán PPF mặt lưng điện thoại", "Chống xước, tự phục hồi vết xước nhẹ, trong suốt.", 50000, 400, ["ppf", "phone"]],
      ["Giá đỡ iPad bằng nhôm để bàn", "Khớp xoay 360 độ, cứng cáp, phù hợp xem phim làm việc.", 280000, 150, ["tabletstand", "ipad"]],
      ["Loa Bluetooth JBL Go 3", "Nhỏ gọn bằng bàn tay, chống nước IP67, âm bass mạnh mẽ.", 850000, 100, ["bluetoothspeaker", "jbl"]],
      ["Quạt tản nhiệt điện thoại Memo DL05", "Tản nhiệt sò lạnh làm mát tức thì, chơi game không tụt FPS.", 250000, 200, ["cooler", "gaming"]],
      ["Thẻ nhớ MicroSD Samsung Evo Plus 64GB", "Tốc độ đọc 130MB/s, lưu trữ video 4K, dùng cho camera, điện thoại.", 180000, 300, ["microsd", "memorycard"]]
    ]
  },
  {
    categorySlug: "do-choi-giai-tri",
    shopId: 3014n,
    products: [
      ["Bộ xếp hình Lego Classic 10698", "Hộp gạch sáng tạo lớn 790 mảnh, nhiều màu sắc tự do sáng tạo.", 1250000, 100, ["lego", "toy"]],
      ["Xe ô tô điều khiển từ xa địa hình Rock Crawler", "Sóng 2.4Ghz, pin sạc, phuộc nhún độc lập chạy mọi địa hình.", 450000, 150, ["rccar", "toy"]],
      ["Board game Ma Sói Ultimate", "Phiên bản mở rộng đầy đủ các nhân vật, trò chơi tiệc tùng hấp dẫn.", 180000, 300, ["boardgame", "werewolf"]],
      ["Mô hình Gundam HG 1/144 Aerial", "Lắp ráp chi tiết, khớp nối linh hoạt, dòng The Witch from Mercury.", 350000, 120, ["gundam", "modelkit"]],
      ["Búp bê Barbie Fashionistas", "Nhiều phụ kiện thời trang, giúp bé gái phát triển gu thẩm mỹ.", 290000, 200, ["barbie", "doll"]],
      ["Đồ chơi rút gỗ Jenga", "Trò chơi thử thách sự khéo léo và kiên nhẫn, thích hợp chơi nhóm.", 120000, 400, ["jenga", "woodentoy"]],
      ["Máy chơi game Nintendo Switch OLED", "Màn hình OLED 7 inch rực rỡ, chân dựng cứng cáp, kèm Joy-Con.", 8500000, 40, ["nintendo", "console"]],
      ["Thú nhồi bông Capybara", "Chất liệu vải nhung mềm mịn, bông nhồi gòn tinh khiết an toàn.", 250000, 250, ["capybara", "plush"]],
      ["Đất nặn Play-Doh hộp 10 màu", "Đất nặn an toàn, không dính tay, kích thích sáng tạo cho bé.", 150000, 300, ["playdoh", "toy"]],
      ["Diều sáo lắp ghép", "Khung carbon nhẹ, vải chống thấm, dễ bay kể cả gió nhẹ.", 180000, 150, ["kite", "outdoor"]],
      ["Đồ chơi lắp ráp tàu vũ trụ Apollo", "Mô hình tỉ lệ 1:110 chi tiết, trang trí bàn làm việc.", 850000, 50, ["apollo", "lego"]],
      ["Con quay vô cực Nado", "Đồ chơi đối kháng cho bé trai, bằng kim loại siêu bền.", 150000, 200, ["nado", "toy"]],
      ["Cát động lực Viacom 1kg kèm khuôn", "Không dính tay, an toàn, cho bé thỏa sức sáng tạo.", 180000, 150, ["kineticsand", "toy"]],
      ["Máy bay điều khiển từ xa Flycam Mini", "Có camera 4K, giữ độ cao ổn định, thao tác qua điện thoại.", 650000, 80, ["drone", "toy"]],
      ["Đồ chơi bồn tắm rùa bơi lội", "Lên cót tự bơi trong nước, giúp bé thích thú khi tắm.", 35000, 300, ["bathtoy", "toy"]],
      ["Bộ đồ chơi nấu ăn nhà bếp 36 món", "Bếp ga có hiệu ứng âm thanh và khói như thật.", 250000, 120, ["kitchentoy", "toy"]],
      ["Xếp hình Nam châm Magical Magnet 60 chi tiết", "Phát triển tư duy không gian 3D cho trẻ em.", 350000, 100, ["magnettoy", "toy"]],
      ["Ván trượt Skateboard mặt nhám", "Bánh xe cao su PU bám đường, trục hợp kim chắc chắn.", 450000, 60, ["skateboard", "sports"]],
      ["Bài Uno mở rộng Việt Hóa", "Thêm lá bài chức năng mới cực thú vị, chơi nhóm bao vui.", 65000, 400, ["uno", "cardgame"]],
      ["Mô hình Pop Mart Labubu The Monsters", "Blind box bất ngờ, nhân vật Labubu siêu hot sưu tầm.", 280000, 200, ["popmart", "blindbox"]]
    ]
  },
  {
    categorySlug: "may-anh-phu-kien",
    shopId: 3015n,
    products: [
      ["Máy ảnh Mirrorless Sony Alpha A7 IV", "Cảm biến Full-frame 33MP, lấy nét mắt người/động vật cực nhanh.", 55900000, 20, ["sony", "camera"]],
      ["Ống kính Canon RF 50mm f/1.8 STM", "Lens chân dung quốc dân, nhỏ gọn, xóa phông mịn màng.", 4500000, 50, ["lens", "canon"]],
      ["Gimbal chống rung DJI RS 3 Mini", "Gimbal nhỏ gọn nhẹ 795g, tải trọng 2kg, quay phim chuyên nghiệp.", 7290000, 40, ["gimbal", "dji"]],
      ["Thẻ nhớ SDXC SanDisk Extreme Pro 128GB", "Tốc độ đọc 200MB/s, ghi 90MB/s, quay video 4K mượt mà.", 650000, 150, ["sdcard", "sandisk"]],
      ["Pin máy ảnh Sony NP-FZ100", "Pin zin dung lượng cao 2280mAh, dùng cho A7III, A7IV, A7C.", 1850000, 60, ["battery", "sony"]],
      ["Chân máy ảnh Benro Tripod T880EX", "Hợp kim nhôm, chịu tải 3kg, dùng cho máy ảnh và điện thoại.", 550000, 100, ["tripod", "camera"]],
      ["Tủ chống ẩm Andbon 30L", "Điều khiển kỹ thuật số, tiết kiệm điện, bảo vệ máy ảnh khỏi nấm mốc.", 1450000, 80, ["drycabinet", "camera"]],
      ["Đèn Flash Godox V860III", "Pin lithium hồi đèn nhanh, công suất lớn, ánh sáng chuẩn.", 3800000, 50, ["flash", "godox"]],
      ["Túi đựng máy ảnh Peak Design Everyday Sling 6L", "Thiết kế thông minh, chất liệu chống nước, đeo chéo tiện dụng.", 3500000, 30, ["camerabag", "peakdesign"]],
      ["Bộ vệ sinh máy ảnh VSGO", "Kèm bóng thổi bụi, bút lau lens, dung dịch và khăn lau chuyên dụng.", 250000, 200, ["cleaningkit", "camera"]],
      ["Máy ảnh Fujifilm X-T5 body", "Cảm biến 40MP, chống rung IBIS 7 stop, màu film giả lập cực đỉnh.", 40990000, 15, ["fujifilm", "camera"]],
      ["Ống kính Sigma 30mm f/1.4 cho Sony E", "Lens khẩu độ lớn chụp thiếu sáng tốt, xóa phông mượt.", 6200000, 40, ["sigma", "lens"]],
      ["Mic thu âm không dây Rode Wireless GO II", "Thu âm 2 kênh, khoảng cách 200m, chống ồn thông minh.", 6990000, 30, ["microphone", "rode"]],
      ["Đèn quay phim Amaran 100x Bi-Color", "Công suất 100W, chỉnh nhiệt độ màu 2700K-6500K, chỉ số CRI cao.", 4500000, 25, ["studiolight", "lighting"]],
      ["Softbox lồng tản sáng Godox 60x90", "Ngàm Bowens thông dụng, ánh sáng khuếch tán mềm mại.", 450000, 80, ["softbox", "lighting"]],
      ["Thẻ nhớ CFexpress Sony TOUGH 160GB", "Tốc độ đọc cực khủng 800MB/s, chuyên quay RAW 8K.", 8500000, 20, ["cfexpress", "sony"]],
      ["Kính lọc Filter UV Hoya 67mm", "Bảo vệ thấu kính máy ảnh khỏi bụi xước, không làm giảm độ nét.", 350000, 100, ["uvfilter", "lens"]],
      ["Balo máy ảnh K&F Concept chống nước", "Ngăn chia chống sốc dày, chứa được 2 body và nhiều lens.", 1200000, 50, ["camerabackpack", "bag"]],
      ["Dây đeo máy ảnh Peak Design Slide Lite", "Thao tác tháo lắp 1 giây bằng ngoàm neo, bản to chống mỏi.", 1550000, 60, ["camerapad", "peakdesign"]],
      ["Đầu đọc thẻ đa năng Ugreen USB-C", "Đọc cùng lúc thẻ SD và MicroSD, tốc độ truyền chuẩn USB 3.0.", 250000, 150, ["cardreader", "ugreen"]]
    ]
  }
];

const categoryIdBySlug = new Map(CATEGORIES.map((category) => [category.slug, category.id]));

function nameToSlug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function imageUrl(tags, productId, imageIndex) {
  const keyword = tags.join(",");
  return `https://loremflickr.com/800/800/${encodeURIComponent(keyword)}/all?lock=${productId}${imageIndex}`;
}

function buildProducts() {
  const products = [];

  for (const group of PRODUCT_DEFINITIONS) {
    const categoryId = categoryIdBySlug.get(group.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for slug ${group.categorySlug}`);
    }

    for (const item of group.products) {
      const id = BigInt(4001 + products.length);
      const [name, description, price, stockQuantity, tags] = item;
      products.push({
        id,
        shopId: group.shopId,
        categoryId,
        name,
        slug: nameToSlug(name),
        description,
        price: Number(price).toFixed(2),
        stockQuantity,
        thumbnailUrl: imageUrl(tags, Number(id), 0),
        status: "ACTIVE",
        imageTags: tags,
      });
    }
  }

  return products;
}

const PRODUCTS = buildProducts();

async function main() {
  await prisma.$connect();

  await prisma.$transaction(async (tx) => {
    const categorySlugs = CATEGORIES.map((category) => category.slug);
    const shopSlugs = SHOPS.map((shop) => shop.slug);
    const productSlugs = PRODUCTS.map((product) => product.slug);
    const productIds = PRODUCTS.map((product) => product.id);
    
    const existingCategories = await tx.category.findMany({
      where: { slug: { in: categorySlugs } },
      select: { id: true },
    });
    
    const existingShops = await tx.shop.findMany({
      where: { slug: { in: shopSlugs } },
      select: { id: true },
    });
    
    const existingCategoryIds = existingCategories.map((category) => category.id);
    const existingShopIds = existingShops.map((shop) => shop.id);

    const existingProducts = await tx.product.findMany({
      where: {
        OR: [
          { slug: { in: productSlugs } },
          { categoryId: { in: existingCategoryIds } },
          { shopId: { in: existingShopIds } },
        ],
      },
      select: { id: true, slug: true },
    });

    const existingProductIds = existingProducts.map((product) => product.id);
    const allProductIds = [...new Set([...productIds, ...existingProductIds])];

    await tx.productImage.deleteMany({
      where: { productId: { in: allProductIds } },
    });

    await tx.product.deleteMany({
      where: { id: { in: existingProductIds } },
    });

    await tx.shop.deleteMany({
      where: {
        OR: [
          { slug: { in: shopSlugs } },
          { id: { in: SHOPS.map((s) => s.id) } }
        ]
      },
    });

    await tx.category.deleteMany({
      where: {
        OR: [
          { slug: { in: categorySlugs } },
          { id: { in: CATEGORIES.map((c) => c.id) } }
        ]
      },
    });

    await tx.category.createMany({ data: CATEGORIES });
    await tx.shop.createMany({ data: SHOPS });

    await tx.product.createMany({
      data: PRODUCTS.map(({ imageTags, ...product }) => ({
        ...product,
        deletedAt: null,
      })),
    });

    // 300 products * 4 images = 1200 images
    for (const product of PRODUCTS) {
      await tx.productImage.createMany({
        data: [0, 1, 2, 3].map((imageIndex) => ({
          productId: product.id,
          imageUrl: imageUrl(product.imageTags, Number(product.id), imageIndex),
          sortOrder: imageIndex,
        })),
      });
    }
  });

  console.log(`Seeded catalog_service with ${CATEGORIES.length} categories, ${SHOPS.length} shops, and ${PRODUCTS.length} products (4 real images each).`);
  console.table(
    SHOPS.map((shop) => ({
      shopId: shop.id.toString(),
      shopName: shop.name,
      slug: shop.slug,
    }))
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
