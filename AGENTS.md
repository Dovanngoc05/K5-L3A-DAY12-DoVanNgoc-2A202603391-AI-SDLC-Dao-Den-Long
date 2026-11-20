# AGENTS.md — Quy ước phát triển Phase 2 (Contract v1.1)

> **Dự án:** Đảo Đèn Lồng (Lantern Island) — AI SDLC Day 12  
> **Tác giả:** Đỗ Văn Ngọc (MSSV: 2A202603391)  
> **Giai đoạn:** Phase 2 — Ticket-02 "Ba hòn đảo" (Test Contract v1.1)

---

## 1. Lệnh thường dùng
* **Cài đặt:** `npm install`
* **Kiểm thử tự động:** `npm test`
* **Chạy 3D Game:** `npm start` (mở `http://localhost:3000`)
* **Chạy Headless CLI:**
  ```bash
  node src/headless.js --seed 42 --night 1 --ticks 600 --out output.jsonl
  node src/headless.js --seed 42 --night 2 --ticks 600 --out output.jsonl
  node src/headless.js --seed 42 --night 3 --ticks 600 --out output.jsonl
  ```

---

## 2. Ràng buộc Test Contract v1.1
1. **Thứ tự 12 bước trong mỗi Tick (Bắt buộc):**
   - Đọc input (xử lý pause trước) -> Giảm bộ đếm -> Di chuyển Mây (nhảy, lướt, bục nhảy, gió) & kiểm tra rơi đảo -> Nhặt đom đóm & bùa -> Tương tác đèn -> Cập nhật vùng an toàn 6m -> Tỏa Sáng -> Di chuyển Bóng Mực & Gió Lạc -> Chạm / Cướp -> Sinh thực thể -> Xét thắng/thua -> Ghi snapshot.
2. **Số liệu chuẩn (Part 1 Ticket-02):**
   - Tốc độ chạy 6.0 m/s; Nhảy 7.0 m/s, g = -20 m/s²; Lướt 14 m/s (12 ticks, cd 90 ticks).
   - Đom đóm mang tối đa 10; Thắp đèn cần 10 đom đóm; Vùng an toàn đèn 6.0m.
   - Tỏa sáng tốn 3 đom đóm, bán kính 5m, choáng 120 ticks, đẩy lùi 4m trong 15 ticks đầu.
   - Trạng thái Bóng Mực chuẩn: `spawning`, `wander`, `chase`, `recoil`, `stunned`.
   - Rơi khỏi đảo ($Y < -10$): -1 Flame, mất toàn bộ đom đóm, chờ 60 ticks rồi hồi sinh tại (0,0,0) với 90 ticks bất tử.
3. **Thực thể mới:**
   - Gió Lạc (`drifters`): Tốc độ 7 m/s, cướp khi mang >= 5 đom đóm trong 15m.
   - Bùa Gió (`charms`): Chạy 7.2 m/s, Lướt không hồi chiêu trong 600 ticks.
   - 3 Đêm: Đêm 1 (Đảo Bến R=40), Đêm 2 (Đảo Cau 2 đảo + cầu tre), Đêm 3 (Đảo Chuông 3 tầng).
4. **Hiệu năng Headless:** 21.600 ticks phải chạy xong trong <= 30 giây.
