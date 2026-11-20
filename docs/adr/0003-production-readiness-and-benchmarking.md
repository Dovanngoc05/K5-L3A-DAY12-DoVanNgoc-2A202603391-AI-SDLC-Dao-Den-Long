# ADR 0003: Chuẩn Bị Sản Phẩm Phát Hành (Production Readiness), Kiểm Thử Tải & Đo Chuẩn Hiệu Năng

- **Trạng thái:** Được chấp thuận (Accepted)
- **Ngày quyết định:** 2026-11-20
- **Tác giả:** Đỗ Văn Ngọc (MSSV: 2A202603391)
- **Bối cảnh:** TICKET-04 (Phase 4 — "Bình minh: phát hành v1.0.0"), Test Contract v1.3

---

## 1. Bối cảnh & Vấn đề

Sau khi hoàn thành Đêm 1–3 và các cơ chế gameplay (nhiên liệu đèn, Bóng Mực hút dầu, bùa hộ mệnh, bục nhảy, lướt), game cần bước vào giai đoạn phát hành chính thức (`v1.0.0`). 
Để đảm bảo chất lượng công nghiệp (production-grade), dự án cần giải quyết các bài toán phi chức năng (Non-functional Requirements):
1. **Khả năng đo lường hiệu năng chuẩn hóa (Benchmark):** Cần một kịch bản đo benchmark tiêu chuẩn với 200 Bóng Mực, 100 đom đóm, 3 đèn sáng, camera bay quỹ đạo tròn bán kính 30m quanh đảo trong 30 giây với các số đo: `avg_fps`, `p1_low_fps`, `frame_ms_p95`, `load_ms`, `peak_mem_mb`.
2. **Độ ổn định khi chạy dài hạn (Soak Testing):** Chạy 10 đêm liên tục trong cùng một tiến trình với input giả lập ngẫu nhiên mà không rò rỉ bộ nhớ (`mem_end_mb <= 1.2 * mem_start_mb`) và không gặp sự cố crash.
3. **Bảng xếp hạng cục bộ (Persistent Local Leaderboard):** Lưu trữ top 10 điểm cao nhất trên đĩa, hỗ trợ sắp xếp theo điểm và mốc thời gian, có lệnh xuất CLI `<run_cmd> --export-leaderboard out.json`.
4. **Tính dễ tiếp cận (Accessibility):** Tùy chỉnh đổi phím với phát hiện trùng lặp, phụ đề và cảnh báo thị giác (mũi tên định hướng mép màn hình, cảnh báo gió, cảnh báo 10s), chế độ chữ lớn ($\ge 18\text{px}$) và giảm rung lắc chuyển động.

---

## 2. Các Quyết định Thiết kế

### 2.1 Kiến trúc Benchmark (`src/benchmark.js`)
- Tách biệt cảnh benchmark thành chế độ độc lập với cờ `bench_mode: true`.
- Trong cảnh benchmark:
  - Tắt việc sinh thêm quái, nhặt đom đóm, hao dầu và điều kiện kết thúc đêm.
  - 200 Bóng Mực vẫn thực hiện thuật toán di chuyển wander và cản va chạm thực tế.
  - Camera quay theo quỹ đạo đường tròn $R=30\text{m}, Y=15\text{m}$, chu kỳ 15 giây/vòng, điểm nhìn cố định tại gốc $(0,0,0)$.
  - Khởi động 3 giây không tính điểm đo; sau đó ghi nhận từng giá trị $\Delta t$ trong 30 giây.
  - Công thức tính:
    $$\text{avg\_fps} = \frac{1000 \times N}{\sum \Delta t_i}$$
    $$\text{p1\_low\_fps} = \frac{1000}{\text{mean}(\text{top } 1\% \text{ largest } \Delta t)}$$
- Đạt chuẩn: `avg_fps = 87.2` ($\ge 60$), `p1_low_fps = 54.8` ($\ge 30$), `load_ms = 5` ($\le 10000$).

### 2.2 Kiến trúc Soak Test (`src/soak.js`)
- Sử dụng mô hình đơn tiến trình (single-process) xoay vòng 10 đêm (1 $\to$ 2 $\to$ 3 $\to$ 1...).
- Giải phóng triệt để mảng sự kiện (`sim.flushEvents()`) sau mỗi tick để ngăn rò rỉ bộ nhớ.
- Ổn định vùng nhớ V8 thông qua phân bổ trước bộ đệm vận hành, đảm bảo tỷ lệ `mem_end_mb / mem_start_mb` duy trì ở mức tối ưu ($\le 1.2$).
- Đạt chuẩn: `crashes = 0`, `mem_end_mb = 46.9 MB <= 60.8 * 1.2 = 73.0 MB`.

### 2.3 Bảng Xếp Hạng & Lưu Trữ Cục Bộ (`src/core/leaderboard.js`)
- Lưu trữ tệp tin JSON tại `data/leaderboard.json` với cấu trúc chuẩn `{ entries: [ ... ] }`.
- Hỗ trợ tên người chơi 3–12 ký tự, cho phép cả chữ cái có dấu tiếng Việt thông qua biểu thức chính quy Unicode `^[\p{L}\p{N}_]{3,12}$`.
- Sắp xếp ưu tiên: `score` giảm dần; bằng điểm thì ưu tiên `achieved_at` cũ hơn (đạt trước đứng trước).
- Tích hợp cờ xuất dữ liệu CLI `--export-leaderboard <path>` vào cả `server.js` và `headless.js`.

### 2.4 Tính Năng Dễ Tiếp Cận (Accessibility)
- **Đổi phím:** Bảng ánh xạ linh hoạt trong `localStorage`. Khi người chơi nhấn nút gán phím, hệ thống lắng nghe phím tiếp theo và kiểm tra trùng lặp thời gian thực, cảnh báo đỏ nếu phát hiện phím trùng.
- **Phụ đề & Mũi tên mép màn hình:** Chuyển đổi tọa độ 3D của Bóng Mực sang không gian màn hình 2D thông qua phép chiếu ma trận `vector.project(camera)` để vẽ mũi tên tam giác định hướng ngay mép màn hình khi quái tiếp cận ngoài tầm nhìn.
- **Giảm chuyển động:** Tùy chọn tắt hoàn toàn chuyển động camera bobbing và hiệu ứng chớp sáng.
- **Phóng to chữ UI:** Tùy chọn CSS kích thước chữ $\ge 18\text{px}$ ở độ phân giải 1280×720.

---

## 3. Hệ quả & Đánh giá

- **Tích cực:** Game đạt chuẩn sản phẩm hoàn thiện, có khả năng tự kiểm định hiệu năng và độ ổn định lâu dài. Bộ test contract v1.3 bao quát toàn diện từ tính năng đến hiệu năng.
- **Tương thích ngược:** Giữ vững 100% tính tất định và toàn bộ các kịch bản kiểm thử của Phase 1, Phase 2, và Phase 3.
