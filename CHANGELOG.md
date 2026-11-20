# Changelog — Đảo Đèn Lồng

Tất cả các thay đổi lớn giữa các Phase được ghi nhận tại đây theo chuẩn Keep a Changelog.

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
