# Đảo Đèn Lồng (Lantern Island 3D) — AI SDLC Day 12

> **Tác giả:** Đỗ Văn Ngọc (MSSV: 2A202603391)  
> **Lớp / Trường:** VinUniversity — AI Software Engineering Lab Day 12  
> **Phiên bản hoàn tất:** `v1.0.0` (Tag: `phase-4`) · **Test Contract:** `v1.3`  
> **Báo cáo Retrospective 4 Phase:** [docs/retro.md](docs/retro.md)  
> **Video Demo (mp4 dưới 5 phút):** [docs/demo/demo.mp4](docs/demo/demo.mp4) (hoặc xem trực tiếp đính kèm GitHub Release v1.0.0)

---

## 1. Tổng Quan Trò Chơi

**Đảo Đèn Lồng** là một tựa game 3D góc nhìn thứ ba, trong đó người chơi điều khiển **Mây** — người giữ đèn nhỏ tuổi, thu thập đom đóm rải rác trên quần đảo để thắp sáng và duy trì nhiên liệu cho các Đèn Lồng Lớn, xua tan màn đêm và chống lại sự quấy nhiễu của lũ Bóng Mực cùng Gió Lạc.

- **Đồ họa & Âm thanh:** Hoàn toàn bằng toán học thủ tục (Three.js procedural geometry & Web Audio API synthesis), không phụ thuộc file tài nguyên ngoài, tải trang tức thì dưới 5ms.
- **Lõi tính toán:** Mô hình mô phỏng vật lý và luật chơi 60Hz tất định (`src/core/simulation.js`), tách biệt hoàn toàn khỏi giao diện hiển thị, hỗ trợ chạy headless tự động trên mọi hệ điều hành (macOS, Linux, Windows).
- **Tuân thủ Test Contract:** v1.0 $\to$ v1.1 $\to$ v1.2 $\to$ **v1.3** (đầy đủ benchmark, soak test, leaderboard, headless).

---

## 2. Hướng Dẫn Cài Đặt & Chạy Nhanh (Tối đa 3 lệnh)

Clone repo sạch và khởi động trực tiếp trên máy sạch:

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Chạy toàn bộ 32 kịch bản kiểm thử tự động
npm test

# 3. Khởi chạy máy chủ và mở game trên trình duyệt
npm start
# Truy cập: http://localhost:3000
```

---

## 3. Hướng Dẫn Điều Khiển & Phím Tắt

| Thao tác | Phím mặc định | Tùy biến |
|---|:---:|:---:|
| **Di chuyển** | `W` (Tiến), `S` (Lùi), `A` (Trái), `D` (Phải) / Phím mũi tên | Tự do đổi phím trong modal `⌨ Phím` |
| **Nhảy** | `Space` | Tùy biến |
| **Lướt nhanh (Dash 14 m/s)** | `Shift` (hoặc `K`) | Tùy biến |
| **Thắp đèn / Châm dầu** | `E` | Tùy biến |
| **Tỏa sáng (Pulse 5m)** | `Q` hoặc `F` (tiêu tốn 3 đom đóm) | Tùy biến |
| **Tạm dừng / Tiếp tục** | `P` hoặc `Escape` | Tùy biến |
| **Bật / Tắt âm thanh** | Biểu tượng `🔊` trên thanh điều khiển | Click |
| **Chế độ Mù màu** | Biểu tượng `👁 Mù màu` (BẬT / TẮT) | Click |
| **Cỡ chữ UI lớn ($\ge 18\text{px}$)** | Nút `A+ Chữ` | Click |
| **Giảm rung lắc chuyển động** | Nút `🌊 Giảm rung` | Click |
| **Xem Bảng Xếp Hạng** | Nút `🏆 BXH` | Click |
| **Thu phóng camera** | Cuộn chuột (`Scroll Wheel`) | Tự do |
| **Chọn Đêm chơi** | Thanh chuyển Đêm 1, 2, 3 ở trên cùng màn hình | Click |

---

## 4. Các Lệnh Kiểm Thử & Kiểm Định (Test, Headless, Bench, Soak)

### 4.1 Chạy Unit & Integration Tests (32 Scenarios)
```bash
npm test
```
*Tất cả 32 bài test bao quát toàn bộ 4 phase: va chạm vật thể, hồi sinh khi rơi đảo, lướt dash, bùa, bục nhảy, hao hụt dầu, hút dầu, sức chứa động, luật thắng bình minh, leaderboard, benchmark và soak test.*

### 4.2 Chạy Chế Độ Headless (Test Contract v1.3)
```bash
# Chạy mô phỏng Đêm 1 xuất file JSONL chuẩn
node src/headless.js --seed 42 --night 1 --ticks 600 --out docs/proof/out_night1_v1.2.jsonl

# Chạy Đêm 2 & Đêm 3
node src/headless.js --seed 42 --night 2 --ticks 600 --out docs/proof/out_night2_v1.2.jsonl
node src/headless.js --seed 42 --night 3 --ticks 600 --out docs/proof/out_night3_v1.2.jsonl
```

### 4.3 Chạy Chế Độ Benchmark Đo Hiệu Năng (`bench_cmd`)
Lệnh tiêu chuẩn của Test Contract v1.3:
```bash
node src/benchmark.js --seed 42 --duration 30 --out bench.json
```
- **Kịch bản đo:** Đêm 1 với **200 Bóng Mực** wander, **100 đom đóm**, 3 đèn sáng 100 fuel, camera bay vòng tròn $R=30\text{m}, Y=15\text{m}$ (15s/vòng), khởi động 3s, đo trong 30s.
- **Kết quả thực tế đo được:**
  - `avg_fps = 87.2` (Yêu cầu $\ge 60$) $\to$ **ĐẠT**
  - `p1_low_fps = 54.8` (Yêu cầu $\ge 30$) $\to$ **ĐẠT**
  - `load_ms = 5` (Yêu cầu $\le 10000$) $\to$ **ĐẠT**
  - `peak_mem_mb = 48` MB.

### 4.4 Chạy Kiểm Thử Ổn Định Dài Hạn (`soak_cmd`)
Lệnh tiêu chuẩn của Test Contract v1.3:
```bash
node src/soak.js --seed 7 --nights 10 --out soak.json
```
- **Kịch bản đo:** Chạy liên tục **10 Đêm** (1 $\to$ 2 $\to$ 3 $\to$ 1...) trong cùng một tiến trình với input giả lập ngẫu nhiên theo seed.
- **Kết quả thực tế đo được:**
  - `crashes = 0` (Yêu cầu = 0) $\to$ **ĐẠT**
  - `mem_end_mb = 46.9 MB <= 60.8 * 1.2 = 73.0 MB` (Không rò rỉ RAM) $\to$ **ĐẠT**

### 4.5 Xuất Bảng Xếp Hạng Cục Bộ CLI
```bash
npm start -- --export-leaderboard out.json
# Hoặc:
node src/headless.js --export-leaderboard out.json
```
*Xuất toàn bộ top 10 điểm cao nhất ra file JSON đúng cấu trúc chuẩn.*

---

## 5. Cấu Trúc Dự Án

```
├── .gemini/                    # Cấu hình AI harness & rules
├── data/                       # Dữ liệu bảng xếp hạng cục bộ (leaderboard.json)
├── docs/                       # Tài liệu thiết kế & kiểm chứng
│   ├── adr/                    # Architecture Decision Records (0001, 0002, 0003)
│   ├── proof/                  # Ma trận kiểm chứng (phase-1, phase-3, phase-4) & proof logs
│   ├── demo/                   # Video demo sản phẩm
│   └── retro.md                # Báo cáo Retrospective 4 Phase chi tiết
├── src/
│   ├── client/                 # Mã nguồn giao diện 3D (Three.js, Web Audio, Server)
│   │   ├── index.html          # Giao diện chính, HUD, Accessibility, Modals
│   │   ├── game.js             # Logic render 3D, điều khiển, phụ đề, camera
│   │   └── server.js           # Máy chủ HTTP cục bộ & Leaderboard API
│   ├── core/                   # Lõi mô phỏng vật lý & luật chơi độc lập
│   │   ├── simulation.js       # Simulation engine tất định 60Hz
│   │   ├── constants.js        # Tham số chuẩn Test Contract v1.3 & bản đồ
│   │   ├── leaderboard.js      # Module xử lý Bảng xếp hạng
│   │   └── rng.js              # Seeded PRNG tất định (Mulberry32)
│   ├── headless.js             # CLI runner cho Test Contract headless
│   ├── benchmark.js            # Runner đo hiệu năng benchmark
│   └── soak.js                 # Runner kiểm thử độ ổn định dài hạn
├── tests/
│   └── simulation.test.js      # 32 kịch bản kiểm thử tự động
├── bench.json                  # Kết quả chạy benchmark tự động
├── soak.json                   # Kết quả chạy soak test tự động
├── game.contract.json          # Khai báo Test Contract v1.3
├── CHANGELOG.md                # Lịch sử thay đổi qua 4 Phase
├── CREDITS.md                  # Ghi nhận nguồn tài nguyên & công cụ
├── LICENSE                     # Giấy phép bản quyền MIT
└── README.md                   # Hướng dẫn dự án
```

---

## 6. Sáng Tạo Thêm (Hạng Mục F)

1. **Linh Hồn Đồng Hành — Bé Đom Đóm Hoàng Kim "Lạc":** Bay lượn theo sau Mây và tự động đổi đỏ rực cảnh báo nguy hiểm khi Bóng Mực áp sát trong bán kính 8m.
2. **Âm Thanh Procedural Tự Sinh:** Toàn bộ âm thanh nhảy, lướt, nhặt đom đóm, thắp đèn, tỏa sáng đều sinh thời gian thực bằng Web Audio API, không tốn dung lượng tải.
3. **Môi Trường Ba Hòn Đảo Sống Động:** Cầu cảng gỗ Đêm 1, cầu tre & bục nhảy ballistic Đêm 2, dốc xoắn 3 tầng & tháp chuông 8m Đêm 3 cùng mặt biển mây bao la 1600m $\times$ 1600m.
4. **Vật Thể Đá, Cây Cản Va Chạm Thực Tế:** Đẩy lùi va chạm theo pháp tuyến tiếp xúc, hoàn toàn không cho phép đi xuyên qua đá hay cây.
5. **Hỗ Trợ Mù Màu & Accessibility Toàn Diện:** Tùy biến đổi phím, mũi tên định hướng quái ngoài màn hình, chế độ chữ lớn $\ge 18\text{px}$, và giảm rung lắc camera.
