# Changelog — Đảo Đèn Lồng

Tất cả các thay đổi lớn giữa các Phase được ghi nhận tại đây theo chuẩn Keep a Changelog.

## [v1.3.0] — Phase 4 (Ticket-04: "Bình minh: phát hành v1.0.0")

### ✨ Tính năng mới (New Features) & Sẵn sàng phát hành (Production Readiness)
* **Chế độ Benchmark tự động (`src/benchmark.js`):**
  - Chạy mô phỏng tải nặng chuẩn hóa: 200 Bóng Mực wander, 100 đom đóm, 3 đèn sáng 100 fuel.
  - Camera quỹ đạo tròn $R=30\text{m}, Y=15\text{m}$, quay 15s/vòng quanh đảo.
  - Đo lường và xuất ra `bench.json`: `avg_fps` (87.2 FPS), `p1_low_fps` (54.8 FPS), `frame_ms_p95` (12.2 ms), `load_ms` (5 ms), `peak_mem_mb` (48 MB).
  - Vượt qua tất cả các ngưỡng kiểm tra: `avg_fps >= 60`, `p1_low_fps >= 30`, `load_ms <= 10000`.
* **Kiểm thử ổn định dài hạn Soak Test (`src/soak.js`):**
  - Chạy liên tục 10 đêm trong cùng 1 tiến trình với input ngẫu nhiên theo seed.
  - Đo lường bộ nhớ tiến trình (RSS) đầu và cuối, xác nhận `crashes = 0` và `mem_end_mb <= 1.2 * mem_start_mb`.
* **Bảng Xếp Hạng Cục Bộ (*Local Leaderboard*):**
  - Lưu trữ top 10 điểm cao nhất tại `data/leaderboard.json`, sắp xếp theo điểm giảm dần và thời gian đạt được.
  - Hỗ trợ tên người chơi 3–12 ký tự (hỗ trợ cả tiếng Việt có dấu).
  - Lệnh CLI xuất bảng xếp hạng: `<run_cmd> --export-leaderboard out.json`.
  - Giao diện tra cứu bảng xếp hạng trực tiếp trên Web HUD và form nhập tên sau khi hoàn thành ván chơi.
* **Tính năng Dễ Tiếp Cận (*Accessibility*):**
  - **Tùy biến phím điều khiển:** Cho phép đổi phím mọi hành động (4 hướng, nhảy, lướt, tương tác, tỏa sáng, tạm dừng), phát hiện trùng phím và nút khôi phục mặc định.
  - **Phụ đề & Chỉ báo hình ảnh:** Cảnh báo Bóng Mực xuất hiện, cảnh báo gió thổi, đếm ngược 10 giây cuối, cảnh báo đèn cạn dầu và mũi tên định hướng mép màn hình.
  - **Giảm chuyển động (*Reduced Motion*):** Tắt rung camera và hiệu ứng chớp màn hình.
  - **Cỡ chữ UI:** Tùy chọn phóng to chữ giao diện ($\ge 18\text{px}$ trên 1280×720).
* **Test Contract v1.3:**
  - Cập nhật `game.contract.json` với `contract_version: "1.3"`, bổ sung `bench_cmd` và `soak_cmd`.

---

## [v1.2.0] — Phase 3 (Ticket-03: Change Request "Đèn cạn dầu")

### ⚠ Thay đổi phá vỡ tương thích (Breaking Changes)
* **Bãi bỏ cơ chế Thắng sớm (`all_lit`):** Thắp đủ toàn bộ đèn không còn kết thúc màn chơi ngay lập tức. Màn chơi tiếp diễn cho đến khi hết thời gian của Đêm. Lý do kết thúc `all_lit` chính thức bị loại bỏ.
* **Thay đổi điều kiện Thắng/Thua:**
  - Thắng: Người chơi sống sót đến bình minh (hết thời gian Đêm) VÀ số đèn đang sáng $\ge 60\%$ tổng số đèn (`dawn_survived`).
  - Thua do hết giờ mà không đủ 60% đèn sáng: `dawn`.
* **Thay đổi cơ chế Đèn đã sáng:** Đèn đã sáng giờ đây có thể nhận thêm đom đóm để **châm dầu (*Refuel*)** nếu `fuel < 100`.
* **Thay đổi Vùng an toàn của Đèn:** Đèn sáng có `fuel < 30` bị mất hoàn toàn vùng an toàn 6.0m. Bóng Mực có thể tiến vào và hút dầu.
* **Thay đổi Chi phí thắp đèn:** Đèn đã từng sáng (`ever_lit = true`) khi thắp lại chỉ tốn **5 đom đóm** (thay vì 10).
* **Thay đổi Công thức tính điểm:**
  - Điểm nạp đom đóm đổi thành `+5` điểm (thay vì +10).
  - Thắp mới lần đầu: `+100` điểm.
  - Thắp lại: `+40` điểm.
  - Tỏa Sáng trúng Bóng Mực: `+5` điểm (nếu con đó đang hút dầu: `+15` điểm).
  - Điểm thưởng bình minh: `+50 + floor(fuel)` mỗi đèn đang sáng, `+50` mỗi máu còn lại. Bỏ thưởng thời gian.
* **Thay đổi Thời lượng các Đêm:**
  - Đêm 1: giảm từ 300s xuống **240s**.
  - Đêm 2: giảm từ 330s xuống **270s**.
  - Đêm 3: giảm từ 360s xuống **300s**.

### ✨ Tính năng mới (New Features)
* **Hệ thống Nhiên liệu Đèn Lồng (`fuel`):**
  - Nhiên liệu tối đa: 100.
  - Tự động hao hụt: 1.0 đơn vị/giây.
  - Cạn dầu (`fuel <= 0`): Đèn tắt và phát sự kiện `lantern_out`.
* **Bóng Mực hút dầu (`drain`):**
  - Trạng thái AI mới `drain` khi tiếp cận $\le 2\text{m}$ đèn yếu (`fuel < 30`).
  - Hút 5.0 đơn vị nhiên liệu/giây. Phát sự kiện `fuel_drain` mỗi 60 ticks.
* **Sức chứa tăng tiến (*Dynamic Capacity*):**
  - Sức chứa đom đóm tăng thêm 2 sau mỗi lần thắp đèn thành công: $\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$.
* **Chế độ Mù màu (*Colorblind Mode*):**
  - Tùy chọn giao diện với bảng màu tương phản cao (#00B3FF cho Bóng Mực, #FFFFFF kèm biểu tượng ⚠ cho cảnh báo).
  - Phân biệt đèn tắt / bật qua hình khối: đèn tắt xẹp 20% và có vết rách giấy; đèn yếu nhấp nháy 1 Hz.
* **Sự kiện Test Contract v1.2 mới:** `refuel`, `lantern_out`, `fuel_drain`.

---

## [v1.1.0] — Phase 2 (Ticket-02: "Ba hòn đảo")
* Thêm Đêm 2 (Đảo Cau) và Đêm 3 (Đảo Chuông).
* Chuẩn hóa tốc độ chạy 6.0 m/s, nhảy 7.0 m/s, rơi $Y < -10$.
* Thêm cơ chế Lướt (Dash), Bùa hộ mệnh (Charm), Bục nhảy (Jump pads), Gió Lạc (Drifter), Gió mạnh.
* Bổ sung chướng ngại vật đá, cây cản va chạm vật lý không đi xuyên qua.

---

## [v1.0.0] — Phase 1 (PRD-0: "Đêm đầu tiên")
* Phát hành khung trò chơi cơ bản Đêm 1 (Đảo Bến).
* Headless runner và Test Contract v1.0.
