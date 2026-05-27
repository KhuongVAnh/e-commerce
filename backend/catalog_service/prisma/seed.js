const path = require("path");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { buildDatabaseUrl, loadServiceEnv } = require("../../shared/db-url.cjs");

loadServiceEnv(path.resolve(__dirname, ".."), "catalog_service");

const adapter = new PrismaPg({
  connectionString: buildDatabaseUrl({ defaultSchema: "catalog_service", includeSearchPath: true }),
});
const prisma = new PrismaClient({ adapter });

const SELLER_ONE_ID = 1001n;
const SELLER_TWO_ID = 1002n;

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

const SHOPS = [
  {
    id: 3001n,
    sellerId: SELLER_ONE_ID,
    name: "CNWeb Tech Store",
    slug: "cnweb-tech-store",
    logoUrl: "https://loremflickr.com/300/300/electronics,store?lock=3001",
    address: "12 Nguyễn Huệ, Quận 1, TP.HCM",
    description: "Shop công nghệ chuyên phụ kiện và thiết bị số.",
    status: "ACTIVE",
  },
  {
    id: 3002n,
    sellerId: SELLER_TWO_ID,
    name: "CNWeb Home & Style",
    slug: "cnweb-home-style",
    logoUrl: "https://loremflickr.com/300/300/lifestyle,store?lock=3002",
    address: "35 Lê Lợi, Quận 1, TP.HCM",
    description: "Shop gia dụng, thời trang, làm đẹp và đồ thể thao cho gia đình.",
    status: "ACTIVE",
  },
];

const PRODUCT_DEFINITIONS = [
  {
    categorySlug: "dien-tu",
    shopId: 3001n,
    products: [
      ["Tai nghe Bluetooth chống ồn SoundAir Pro", "Tai nghe over-ear chống ồn chủ động, pin 35 giờ, đệm tai mềm cho làm việc và di chuyển.", 1890000, 32, ["wireless", "headphones"]],
      ["Tai nghe true wireless BassPods Mini", "Tai nghe nhét tai chống nước nhẹ, hộp sạc nhỏ gọn, phù hợp tập luyện và đi làm.", 790000, 48, ["earbuds", "wireless"]],
      ["Bàn phím cơ RGB Red Switch KeyMaster K87", "Bàn phím cơ layout TKL, switch đỏ, keycap PBT và đèn nền RGB nhiều chế độ.", 1290000, 26, ["mechanical", "keyboard"]],
      ["Bàn phím văn phòng không dây SlimKeys", "Bàn phím mỏng, kết nối Bluetooth/2.4G, gõ êm và tiết kiệm pin.", 590000, 45, ["wireless", "keyboard"]],
      ["Chuột gaming HeroMouse G6", "Chuột gaming cảm biến 12.000 DPI, 6 nút lập trình và đèn RGB.", 690000, 38, ["gaming", "mouse"]],
      ["Chuột không dây SilentClick M220", "Chuột văn phòng click êm, pin lâu, phù hợp laptop và làm việc hằng ngày.", 290000, 64, ["wireless", "mouse"]],
      ["Webcam FullHD ClearCam 1080p", "Webcam 1080p có micro kép, tự cân bằng sáng cho học và họp online.", 650000, 22, ["webcam", "camera"]],
      ["Micro thu âm USB StudioMic C1", "Micro condenser USB kèm chân đế, lọc nhiễu tốt cho podcast và livestream.", 890000, 18, ["usb", "microphone"]],
      ["Loa Bluetooth chống nước WaveBox 2", "Loa di động chuẩn chống nước, âm bass chắc, pin 16 giờ.", 990000, 30, ["bluetooth", "speaker"]],
      ["Sạc nhanh GaN 65W PowerCube", "Củ sạc GaN 3 cổng USB-C/USB-A, sạc laptop, điện thoại và tablet.", 790000, 52, ["usb", "charger"]],
      ["Cáp USB-C to USB-C 100W bện dù", "Cáp sạc nhanh 100W dài 1.5m, lõi bền và đầu cắm gia cố.", 190000, 120, ["usb-c", "cable"]],
      ["Pin dự phòng 20000mAh QuickPack", "Pin dự phòng 20.000mAh hỗ trợ PD 22.5W, màn hình hiển thị dung lượng.", 690000, 44, ["powerbank", "charger"]],
      ["Giá đỡ laptop nhôm FoldStand", "Giá đỡ laptop gấp gọn, nâng góc nhìn và hỗ trợ tản nhiệt.", 360000, 55, ["laptop", "stand"]],
      ["Đế tản nhiệt laptop CoolPad 5 Fan", "Đế tản nhiệt 5 quạt, điều chỉnh độ cao, dùng cho laptop 14-17 inch.", 490000, 35, ["laptop", "cooling"]],
      ["Ổ cứng SSD di động 1TB PocketSSD", "SSD di động USB-C tốc độ cao, vỏ kim loại chống sốc nhẹ.", 1990000, 20, ["portable", "ssd"]],
      ["USB 3.2 Flash Drive 128GB", "USB nhỏ gọn dung lượng 128GB, tốc độ đọc nhanh cho tài liệu và media.", 320000, 85, ["usb", "flashdrive"]],
      ["Màn hình LED 24 inch OfficeView", "Màn hình 24 inch FullHD, viền mỏng, phù hợp học tập và văn phòng.", 2790000, 14, ["computer", "monitor"]],
      ["Camera an ninh WiFi HomeCam 2K", "Camera WiFi 2K, quay đêm, đàm thoại hai chiều và phát hiện chuyển động.", 890000, 29, ["security", "camera"]],
      ["Đồng hồ thông minh FitWatch S3", "Smartwatch đo nhịp tim, theo dõi giấc ngủ, pin 7 ngày.", 1490000, 36, ["smartwatch", "watch"]],
      ["Máy đọc sách E-Ink Reader Lite", "Máy đọc sách màn hình e-ink 6 inch, chống chói và lưu trữ hàng nghìn sách.", 2290000, 12, ["ebook", "reader"]],
    ],
  },
  {
    categorySlug: "thoi-trang",
    shopId: 3002n,
    products: [
      ["Áo thun cotton oversize Urban Tee", "Áo thun cotton 100%, form oversize, chất vải dày vừa và thoáng.", 220000, 90, ["cotton", "tshirt"]],
      ["Áo sơ mi linen tay dài", "Sơ mi linen pha cotton, bề mặt tự nhiên, phù hợp đi làm và đi chơi.", 420000, 42, ["linen", "shirt"]],
      ["Áo polo nam pique Classic Fit", "Áo polo vải pique co giãn, cổ đứng form gọn, dễ phối đồ.", 350000, 58, ["polo", "shirt"]],
      ["Áo khoác gió chống nước nhẹ", "Áo khoác gió có mũ, chống mưa nhẹ, gấp gọn trong balo.", 590000, 36, ["windbreaker", "jacket"]],
      ["Quần jeans straight xanh đậm", "Quần jeans form straight, wash xanh đậm, chất denim bền.", 650000, 34, ["blue", "jeans"]],
      ["Quần jogger nỉ Everyday", "Quần jogger nỉ co giãn, bo gấu, phù hợp mặc nhà và vận động nhẹ.", 340000, 52, ["jogger", "pants"]],
      ["Chân váy midi xếp ly", "Chân váy midi xếp ly mềm, lưng thun thoải mái, dễ phối áo sơ mi.", 390000, 31, ["pleated", "skirt"]],
      ["Đầm suông công sở Minimal Dress", "Đầm suông dáng thanh lịch, chất vải ít nhăn, hợp môi trường văn phòng.", 560000, 27, ["office", "dress"]],
      ["Áo len cardigan mỏng", "Cardigan len mỏng, cài nút, dùng tốt khi trời mát hoặc phòng lạnh.", 480000, 25, ["cardigan", "sweater"]],
      ["Quần short kaki basic", "Quần short kaki form regular, túi sâu, màu trung tính dễ mặc.", 280000, 47, ["khaki", "shorts"]],
      ["Giày sneaker trắng CleanStep", "Sneaker trắng tối giản, đế cao su êm, hợp nhiều phong cách.", 890000, 40, ["white", "sneakers"]],
      ["Dép sandal quai ngang Comfort", "Sandal quai ngang đế êm, nhẹ và thoáng cho đi lại hằng ngày.", 260000, 68, ["sandals", "shoes"]],
      ["Túi tote canvas dày", "Túi tote canvas khóa nam châm, đựng laptop 13 inch và vật dụng cá nhân.", 240000, 75, ["canvas", "tote"]],
      ["Balo laptop chống sốc 15.6 inch", "Balo nhiều ngăn, chống sốc laptop, vải trượt nước nhẹ.", 590000, 33, ["laptop", "backpack"]],
      ["Mũ lưỡi trai cotton twill", "Mũ lưỡi trai vải twill, khóa chỉnh sau, phù hợp đi nắng.", 180000, 80, ["baseball", "cap"]],
      ["Thắt lưng da khóa kim", "Thắt lưng da tổng hợp cao cấp, khóa kim tối giản.", 290000, 45, ["leather", "belt"]],
      ["Vớ cổ cao cotton set 5 đôi", "Vớ cổ cao cotton co giãn, thấm hút tốt cho đi học và đi làm.", 150000, 110, ["cotton", "socks"]],
      ["Kính mát gọng vuông UV400", "Kính mát gọng vuông, tròng chống tia UV400, hộp đựng đi kèm.", 320000, 44, ["sunglasses", "fashion"]],
      ["Đồng hồ dây da Classic", "Đồng hồ mặt tối giản, dây da mềm, phù hợp phối đồ công sở.", 760000, 23, ["classic", "watch"]],
      ["Túi đeo chéo mini City Bag", "Túi đeo chéo nhỏ gọn, nhiều ngăn, dùng khi đi chơi hoặc du lịch.", 310000, 49, ["crossbody", "bag"]],
    ],
  },
  {
    categorySlug: "do-gia-dung",
    shopId: 3002n,
    products: [
      ["Nồi chiên không dầu 5L AirCook", "Nồi chiên 5L, điều khiển nhiệt 80-200 độ, lòng nồi chống dính dễ vệ sinh.", 1690000, 24, ["air", "fryer"]],
      ["Máy xay sinh tố thủy tinh BlendPro", "Máy xay cối thủy tinh 1.5L, lưỡi dao inox, xay đá và sinh tố.", 890000, 28, ["blender", "kitchen"]],
      ["Ấm siêu tốc inox 1.7L", "Ấm đun nước inox tự ngắt, công suất 1800W, tay cầm cách nhiệt.", 390000, 50, ["electric", "kettle"]],
      ["Bộ nồi inox 3 món đáy từ", "Bộ nồi inox 3 kích thước, dùng được bếp từ và bếp gas.", 980000, 22, ["stainless", "cookware"]],
      ["Chảo chống dính ceramic 28cm", "Chảo ceramic ít bám dính, tay cầm chắc, dùng cho nhiều loại bếp.", 420000, 41, ["nonstick", "pan"]],
      ["Bình giữ nhiệt inox 750ml", "Bình giữ nhiệt 750ml, giữ nóng/lạnh 8-12 giờ, nắp chống tràn.", 290000, 72, ["thermos", "bottle"]],
      ["Hộp cơm giữ nhiệt 3 tầng", "Hộp cơm inox 3 tầng, có túi giữ nhiệt, phù hợp mang đi làm.", 360000, 39, ["lunchbox", "food"]],
      ["Máy hút bụi cầm tay MiniVac", "Máy hút bụi cầm tay không dây, đầu hút khe, dùng cho xe và bàn làm việc.", 790000, 31, ["handheld", "vacuum"]],
      ["Cây lau nhà xoay 360 độ", "Bộ cây lau nhà kèm xô vắt, đầu lau microfiber thấm hút tốt.", 460000, 44, ["mop", "cleaning"]],
      ["Kệ nhà bếp 3 tầng", "Kệ thép sơn tĩnh điện, 3 tầng để gia vị, nồi nhỏ và vật dụng bếp.", 520000, 27, ["kitchen", "shelf"]],
      ["Đèn bàn LED chống cận", "Đèn bàn LED điều chỉnh sáng, cổ xoay linh hoạt, có chế độ đọc sách.", 430000, 36, ["desk", "lamp"]],
      ["Hộp đựng đồ trong suốt set 4", "Hộp nhựa trong có nắp, xếp chồng gọn, dùng cho tủ quần áo hoặc kho.", 330000, 65, ["storage", "box"]],
      ["Bộ ga giường cotton queen", "Bộ ga gối cotton mềm, thoáng, kích thước queen 1.6m.", 690000, 26, ["bedsheet", "cotton"]],
      ["Gối memory foam nâng cổ", "Gối memory foam hỗ trợ cổ vai, vỏ gối tháo giặt được.", 520000, 34, ["memory", "pillow"]],
      ["Rèm cửa chống nắng một lớp", "Rèm vải chống nắng nhẹ, màu trung tính, kích thước tiêu chuẩn.", 450000, 29, ["curtain", "home"]],
      ["Máy phun sương tinh dầu", "Máy khuếch tán tinh dầu dung tích 300ml, đèn LED ấm.", 390000, 48, ["aroma", "diffuser"]],
      ["Thùng rác đạp chân 12L", "Thùng rác inox 12L có nắp, đạp chân tiện dụng cho bếp và phòng tắm.", 280000, 57, ["trash", "bin"]],
      ["Bộ dao bếp inox 5 món", "Bộ dao bếp inox kèm giá cắm, cán chắc tay cho sơ chế hằng ngày.", 620000, 21, ["kitchen", "knife"]],
      ["Máy ép chậm mini Juicer", "Máy ép chậm nhỏ gọn, ép trái cây ít tạo bọt, dễ tháo rửa.", 1390000, 18, ["slow", "juicer"]],
      ["Máy pha cà phê nhỏ giọt", "Máy pha cà phê drip 600ml, bình thủy tinh và lưới lọc tái sử dụng.", 850000, 20, ["coffee", "maker"]],
    ],
  },
  {
    categorySlug: "lam-dep",
    shopId: 3002n,
    products: [
      ["Sữa rửa mặt dịu nhẹ Daily Cleanser", "Sữa rửa mặt gel ít bọt, làm sạch nhẹ cho da thường đến da dầu.", 220000, 74, ["facial", "cleanser"]],
      ["Kem chống nắng SPF50 Aqua Shield", "Kem chống nắng phổ rộng SPF50, kết cấu nhẹ, không gây bết dính.", 320000, 68, ["sunscreen", "skincare"]],
      ["Serum vitamin C Bright Drop", "Serum vitamin C hỗ trợ làm sáng da, chai thủy tinh tối màu.", 420000, 45, ["vitamin", "serum"]],
      ["Kem dưỡng ẩm Hyaluronic Gel", "Gel dưỡng ẩm chứa hyaluronic acid, thấm nhanh, dùng ngày và đêm.", 350000, 59, ["moisturizer", "skincare"]],
      ["Tẩy trang micellar water 500ml", "Nước tẩy trang micellar dịu nhẹ, làm sạch kem chống nắng và makeup hằng ngày.", 260000, 83, ["micellar", "water"]],
      ["Mặt nạ đất sét Oil Control", "Mặt nạ đất sét hỗ trợ làm sạch dầu thừa, dùng 1-2 lần mỗi tuần.", 280000, 46, ["clay", "mask"]],
      ["Son kem lì Velvet Lip", "Son kem lì chất mịn, màu bền, đầu cọ dễ viền môi.", 210000, 70, ["lipstick", "makeup"]],
      ["Phấn nước cushion Natural Glow", "Cushion nền mỏng nhẹ, finish tự nhiên, kèm bông mút.", 390000, 38, ["cushion", "makeup"]],
      ["Mascara chống lem Volume Lash", "Mascara làm dày mi, chống lem, đầu chải cong dễ dùng.", 250000, 52, ["mascara", "makeup"]],
      ["Kẻ mắt nước Precision Liner", "Kẻ mắt nước đầu mảnh, khô nhanh, màu đen rõ nét.", 180000, 64, ["eyeliner", "makeup"]],
      ["Dầu gội phục hồi Keratin 500ml", "Dầu gội keratin hỗ trợ tóc khô xơ, hương nhẹ dễ chịu.", 290000, 57, ["shampoo", "haircare"]],
      ["Dầu xả mềm mượt Argan 500ml", "Dầu xả argan giúp tóc mềm, giảm rối sau khi gội.", 290000, 53, ["conditioner", "haircare"]],
      ["Máy sấy tóc ion âm Compact", "Máy sấy tóc ion âm, 2 mức nhiệt, đầu gom gió đi kèm.", 690000, 25, ["hair", "dryer"]],
      ["Máy uốn tóc ceramic 32mm", "Máy uốn tóc thanh ceramic 32mm, chỉnh nhiệt và tự ngắt an toàn.", 590000, 19, ["curling", "iron"]],
      ["Bộ cọ trang điểm 12 cây", "Bộ cọ makeup lông mềm, kèm túi đựng, đủ cọ nền, mắt và má.", 360000, 42, ["makeup", "brushes"]],
      ["Nước hoa mini hương hoa 30ml", "Nước hoa nữ mini 30ml, hương hoa nhẹ, phù hợp dùng hằng ngày.", 450000, 33, ["perfume", "bottle"]],
      ["Kem dưỡng tay Shea Butter", "Kem dưỡng tay hương dịu, chất kem thấm nhanh, tuýp nhỏ dễ mang theo.", 120000, 95, ["hand", "cream"]],
      ["Sữa dưỡng thể ceramide 400ml", "Sữa dưỡng thể ceramide cấp ẩm, dùng sau tắm cho da khô.", 310000, 49, ["body", "lotion"]],
      ["Dao cạo lông mày set 3", "Set 3 dao cạo lông mày có nắp bảo vệ, lưỡi sắc và dễ kiểm soát.", 90000, 130, ["eyebrow", "razor"]],
      ["Bông tẩy trang cotton 222 miếng", "Bông tẩy trang cotton mềm, ít xơ, dùng với toner hoặc tẩy trang.", 85000, 150, ["cotton", "pads"]],
    ],
  },
  {
    categorySlug: "the-thao",
    shopId: 3002n,
    products: [
      ["Thảm yoga TPE 6mm Balance Mat", "Thảm yoga TPE chống trượt, dày 6mm, kèm dây buộc mang theo.", 390000, 62, ["yoga", "mat"]],
      ["Bình nước thể thao 1L", "Bình nước nhựa Tritan 1L, vạch giờ nhắc uống nước, nắp chống tràn.", 180000, 100, ["sports", "bottle"]],
      ["Dây kháng lực set 5 mức", "Bộ dây kháng lực 5 mức lực, dùng tập mông, chân và phục hồi chức năng.", 240000, 76, ["resistance", "bands"]],
      ["Tạ tay neoprene 2kg cặp", "Cặp tạ tay 2kg bọc neoprene chống trượt, phù hợp tập tại nhà.", 320000, 41, ["dumbbell", "fitness"]],
      ["Con lăn massage foam roller", "Foam roller hỗ trợ giãn cơ sau tập, bề mặt gai vừa phải.", 260000, 58, ["foam", "roller"]],
      ["Găng tay tập gym GripFit", "Găng tay tập gym đệm lòng bàn tay, cổ tay dán chắc.", 190000, 64, ["gym", "gloves"]],
      ["Dây nhảy tốc độ Speed Rope", "Dây nhảy lõi thép bọc nhựa, tay cầm nhẹ, điều chỉnh chiều dài.", 150000, 88, ["jump", "rope"]],
      ["Bóng đá size 5 Training", "Bóng đá size 5 da PU, dùng tập luyện sân cỏ nhân tạo.", 290000, 46, ["soccer", "ball"]],
      ["Bóng rổ size 7 StreetPlay", "Bóng rổ size 7 bề mặt bám tay, dùng ngoài trời.", 360000, 34, ["basketball", "ball"]],
      ["Vợt cầu lông carbon Lite 88", "Vợt cầu lông carbon nhẹ, căng sẵn dây, phù hợp người mới.", 520000, 29, ["badminton", "racket"]],
      ["Ống cầu lông lông vũ 12 quả", "Ống cầu lông 12 quả, tốc độ ổn định cho tập luyện.", 230000, 50, ["shuttlecock", "badminton"]],
      ["Kính bơi chống sương ClearSwim", "Kính bơi silicone mềm, chống sương, dây chỉnh nhanh.", 220000, 54, ["swimming", "goggles"]],
      ["Mũ bơi silicone Solid Cap", "Mũ bơi silicone co giãn, ôm tóc gọn khi bơi.", 120000, 92, ["swim", "cap"]],
      ["Áo thể thao dry-fit Runner", "Áo thể thao dry-fit thoát ẩm nhanh, phản quang nhẹ khi chạy tối.", 260000, 67, ["running", "shirt"]],
      ["Quần legging tập yoga", "Legging co giãn 4 chiều, lưng cao, túi nhỏ bên hông.", 340000, 39, ["yoga", "leggings"]],
      ["Giày chạy bộ RoadRun Lite", "Giày chạy bộ đệm êm, upper thoáng khí, phù hợp chạy ngắn.", 990000, 32, ["running", "shoes"]],
      ["Túi trống thể thao 35L", "Túi trống thể thao 35L có ngăn giày riêng, dây đeo vai.", 450000, 44, ["duffel", "bag"]],
      ["Đai bảo vệ đầu gối pair", "Cặp đai bảo vệ đầu gối co giãn, hỗ trợ squat và chạy bộ.", 210000, 73, ["knee", "support"]],
      ["Bộ dụng cụ chống đẩy Push Up Board", "Bảng chống đẩy nhiều vị trí tay, tay cầm chắc, gấp gọn.", 390000, 28, ["pushup", "fitness"]],
      ["Đồng hồ bấm giờ thể thao", "Đồng hồ bấm giờ điện tử, dây đeo cổ, dùng cho huấn luyện.", 160000, 59, ["stopwatch", "sports"]],
    ],
  },
  {
    categorySlug: "sach-van-phong-pham",
    shopId: 3002n,
    products: [
      ["Sổ tay lò xo A5 GridNote", "Sổ tay lò xo khổ A5, giấy dày 80gsm, tiện ghi chú học tập và công việc.", 98000, 140, ["notebook", "stationery"]],
      ["Bút gel 0.5mm SmoothPen set 12", "Set 12 bút gel đầu 0.5mm, mực ra đều, phù hợp viết nhanh và ghi chép.", 120000, 95, ["pen", "stationery"]],
      ["Bìa hồ sơ A4 ClearFile set 20", "Bộ 20 bìa hồ sơ trong suốt khổ A4, bảo vệ giấy tờ và tài liệu.", 75000, 180, ["folder", "office"]],
    ],
  },
  {
    categorySlug: "me-va-be",
    shopId: 3002n,
    products: [
      ["Bình sữa PPSU 300ml SafeBottle", "Bình sữa PPSU chịu nhiệt, cổ rộng, đi kèm núm ti chống sặc.", 210000, 86, ["baby", "bottle"]],
      ["Ghế ăn dặm gấp gọn TinySeat", "Ghế ăn dặm khung chắc, khay tháo rời, gấp gọn khi không dùng.", 690000, 24, ["baby", "chair"]],
      ["Bộ núm ti silicon size M", "Set núm ti silicon mềm, hỗ trợ chuyển tiếp cho bé từ 3 đến 6 tháng.", 95000, 120, ["baby", "nipple"]],
    ],
  },
  {
    categorySlug: "thu-cung",
    shopId: 3002n,
    products: [
      ["Thức ăn hạt cho mèo 1.5kg HappyCat", "Hạt dinh dưỡng cho mèo trưởng thành, hỗ trợ lông mượt và tiêu hóa.", 320000, 58, ["cat", "food"]],
      ["Cát vệ sinh tofu khử mùi 6L", "Cát tofu ít bụi, vón cục nhanh, hỗ trợ khử mùi cho khay vệ sinh.", 180000, 77, ["cat", "litter"]],
      ["Bàn chải chải lông thú cưng", "Bàn chải răng mềm giúp chải lông rụng và massage cho chó mèo.", 110000, 104, ["pet", "brush"]],
    ],
  },
  {
    categorySlug: "o-to-xe-may",
    shopId: 3001n,
    products: [
      ["Camera hành trình 2K RoadCam X2", "Camera hành trình 2K góc rộng, ghi hình ban đêm và chống rung tốt.", 1490000, 21, ["car", "camera"]],
      ["Bơm lốp mini 12V TirePump Pro", "Bơm lốp điện mini cắm tẩu 12V, màn hình số và tự ngắt khi đủ áp.", 890000, 34, ["car", "pump"]],
      ["Giá đỡ điện thoại chống rung MotoGrip", "Giá đỡ điện thoại cho xe máy, khóa chắc tay và giảm rung khi chạy xe.", 240000, 63, ["motorbike", "holder"]],
    ],
  },
  {
    categorySlug: "suc-khoe",
    shopId: 3002n,
    products: [
      ["Máy đo huyết áp điện tử ArmCheck", "Máy đo huyết áp bắp tay, màn hình lớn, lưu kết quả cho nhiều người dùng.", 590000, 31, ["health", "blood-pressure"]],
      ["Cân điện tử thông minh BodySense", "Cân điện tử kết nối app, theo dõi chỉ số cân nặng và BMI.", 450000, 40, ["health", "scale"]],
      ["Nhiệt kế hồng ngoại QuickTemp", "Nhiệt kế đo trán không chạm, cho kết quả nhanh và dễ đọc.", 260000, 92, ["health", "thermometer"]],
    ],
  },
  {
    categorySlug: "thuc-pham-do-uong",
    shopId: 3002n,
    products: [
      ["Cà phê rang xay Arabica 500g", "Cà phê Arabica rang xay vừa, hương thơm rõ, hợp pha phin hoặc máy.", 185000, 88, ["coffee", "drink"]],
      ["Trà ô long túi lọc 30 gói", "Trà ô long túi lọc vị thanh, tiện pha nhanh tại nhà hoặc văn phòng.", 145000, 73, ["tea", "drink"]],
      ["Mật ong hoa nhãn 500g", "Mật ong hoa nhãn nguyên chất, vị ngọt dịu, dùng pha nước hoặc nấu ăn.", 220000, 61, ["honey", "food"]],
    ],
  },
  {
    categorySlug: "nha-cua-vuon",
    shopId: 3002n,
    products: [
      ["Đèn năng lượng mặt trời SolarGlow", "Đèn sân vườn dùng năng lượng mặt trời, tự bật khi trời tối.", 340000, 48, ["garden", "solar"]],
      ["Bình tưới cây phun sương 2L", "Bình tưới áp lực tay, phun sương đều, phù hợp cây cảnh trong nhà.", 120000, 110, ["garden", "sprayer"]],
      ["Kéo cắt cành GardenShear", "Kéo cắt cành thép carbon, lưỡi sắc và tay cầm chống trượt.", 190000, 67, ["garden", "shear"]],
    ],
  },
  {
    categorySlug: "phu-kien-mobile",
    shopId: 3001n,
    products: [
      ["Ốp lưng iPhone trong suốt MagClear", "Ốp lưng trong suốt viền dẻo, tương thích sạc không dây.", 140000, 91, ["iphone", "case"]],
      ["Miếng dán cường lực 9H ScreenGuard", "Kính cường lực 9H chống xước, dễ dán và hạn chế bám vân tay.", 90000, 150, ["screen", "protector"]],
      ["Sạc không dây 15W QiPad", "Đế sạc không dây 15W, hỗ trợ nhiều mẫu điện thoại phổ biến.", 390000, 44, ["wireless", "charger"]],
    ],
  },
  {
    categorySlug: "do-choi-giai-tri",
    shopId: 3002n,
    products: [
      ["Bộ xếp hình lắp ghép 300 mảnh CityBlocks", "Bộ xếp hình 300 mảnh giúp trẻ rèn tư duy và khả năng sáng tạo.", 260000, 52, ["toy", "blocks"]],
      ["Xe điều khiển từ xa DriftCar Pro", "Xe điều khiển từ xa có pin sạc, bánh xe bám tốt và chạy ổn định.", 590000, 29, ["toy", "car"]],
      ["Bảng vẽ điện tử SketchPad", "Bảng vẽ LCD cho bé, xóa một chạm, gọn nhẹ để mang theo.", 280000, 71, ["toy", "drawing"]],
    ],
  },
  {
    categorySlug: "may-anh-phu-kien",
    shopId: 3001n,
    products: [
      ["Chân máy tripod nhôm 1.6m FlexTripod", "Tripod nhôm gọn nhẹ, đầu xoay linh hoạt, dùng cho ảnh và video.", 430000, 36, ["camera", "tripod"]],
      ["Đèn livestream ring light 18 inch GlowRing", "Ring light 18 inch có nhiều mức sáng, phù hợp chụp ảnh và livestream.", 520000, 27, ["camera", "lighting"]],
      ["Túi đựng máy ảnh chống sốc CameraCase", "Túi máy ảnh đệm dày, chia ngăn linh hoạt, bảo vệ thân máy và lens.", 310000, 49, ["camera", "bag"]],
    ],
  },
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
  const encodedTags = tags.map((tag) => encodeURIComponent(tag)).join(",");
  return `https://loremflickr.com/900/900/${encodedTags},product?lock=${productId}${imageIndex}`;
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
      where: {
        slug: {
          in: categorySlugs,
        },
      },
      select: {
        id: true,
      },
    });
    const existingShops = await tx.shop.findMany({
      where: {
        slug: {
          in: shopSlugs,
        },
      },
      select: {
        id: true,
      },
    });
    const existingCategoryIds = existingCategories.map((category) => category.id);
    const existingShopIds = existingShops.map((shop) => shop.id);

    const existingProducts = await tx.product.findMany({
      where: {
        OR: [
          {
            slug: {
              in: productSlugs,
            },
          },
          {
            categoryId: {
              in: existingCategoryIds,
            },
          },
          {
            shopId: {
              in: existingShopIds,
            },
          },
        ],
      },
      select: {
        id: true,
        slug: true,
      },
    });

    const existingProductIds = existingProducts.map((product) => product.id);
    const allProductIds = [...new Set([...productIds, ...existingProductIds])];

    await tx.productImage.deleteMany({
      where: {
        productId: {
          in: allProductIds,
        },
      },
    });

    await tx.product.deleteMany({
      where: {
        id: {
          in: existingProductIds,
        },
      },
    });

    await tx.shop.deleteMany({
      where: {
        slug: {
          in: shopSlugs,
        },
      },
    });

    await tx.category.deleteMany({
      where: {
        slug: {
          in: categorySlugs,
        },
      },
    });

    await tx.category.createMany({
      data: CATEGORIES,
    });

    await tx.shop.createMany({
      data: SHOPS,
    });

    await tx.product.createMany({
      data: PRODUCTS.map(({ imageTags, ...product }) => ({
        ...product,
        deletedAt: null,
      })),
    });

    for (const product of PRODUCTS) {
      await tx.productImage.createMany({
        data: [0, 1, 2].map((imageIndex) => ({
          productId: product.id,
          imageUrl: imageUrl(product.imageTags, Number(product.id), imageIndex),
          sortOrder: imageIndex,
        })),
      });
    }
  });

  console.log(`Seeded catalog_service with ${CATEGORIES.length} categories, ${SHOPS.length} shops, and ${PRODUCTS.length} products.`);
  console.table(
    SHOPS.map((shop) => ({
      shopId: shop.id.toString(),
      sellerId: shop.sellerId.toString(),
      shopName: shop.name,
      slug: shop.slug,
    })),
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
