# Phase 2 Specification & Acceptance Criteria (TICKET-02)

## 1. Tiêu chí nghiệm thu Chuẩn hóa Số liệu (Part 1)
- [ ] **AC-1.1 Di chuyển & Nhảy:** Chạy 6.0 m/s. Nhảy 7.0 m/s chỉ khi `grounded === true`, trọng lực -20 m/s².
- [ ] **AC-1.2 Lướt (Dash):** Kích hoạt khi `dash: true` chuyển từ false -> true. Tốc độ 14 m/s trong 12 ticks, hồi chiêu 90 ticks. Duy trì cao độ Y trên không.
- [ ] **AC-1.3 Đom đóm & Rơi:** Sức chứa 10. Nhặt khi $XZ \le 1.0\text{ m}$ và $|Y| \le 1.5\text{ m}$. Bị đánh rơi $\lfloor \text{carried}/2 \rfloor$ đom đóm quanh vành 1.5-2.5m (tồn tại 480 ticks, nhặt được từ tick kế tiếp).
- [ ] **AC-1.4 Đèn & Vùng an toàn 6m:** Chi phí 10 đom đóm. Đèn lit tạo bán kính 6.0m ngăn Bóng Mực. Bóng ở trong lúc đèn sáng bị đẩy ra mép trong $\le 30$ ticks không gây sát thương.
- [ ] **AC-1.5 Tỏa Sáng:** Tốn 3 đom đóm, bán kính 5m (3D), hồi chiêu 180 ticks. Choáng 120 ticks, đẩy lùi 4m trong 15 ticks đầu. Không đủ 3 đom đóm không kích hoạt.
- [ ] **AC-1.6 Rơi khỏi đảo ($Y < -10$):** Trừ 1 Flame, mất sạch đom đóm. Chờ 60 ticks rồi hồi sinh tại (0,0,0) với 90 ticks bất tử.
- [ ] **AC-1.7 Điểm số:** +10 nạp đom đóm, +100 thắp đèn, +5 stun Bóng Mực, thắng: $+\lfloor \text{time\_left\_s} \rfloor \times 2 + 50 \times \text{flames}$.

## 2. Tiêu chí nghiệm thu 3 Bản đồ chuẩn (Part 2)
- [ ] **AC-2.1 Đêm 1 (Đảo Bến):** Bán kính 40m, xuất phát (0,0,0) quay +Z. 5 đèn L1..L5 theo tọa độ chuẩn. Sinh 2 Shade lúc 5s, sau đó mỗi 8s, tối đa 6.
- [ ] **AC-2.2 Đêm 2 (Đảo Cau):** 2 đảo R=28m tại (0,0,0) và (70,0,0), cầu tre $x \in [26,44], z \in [-2,2]$. 2 bục nhảy (20,0,18) và (50,0,-18) bắn $v_y=14\text{ m/s}, v_{xz}=24\text{ m/s}$. 6 đèn L1..L6. Bùa Gió C1 tại (35,0,0).
- [ ] **AC-2.3 Đêm 3 (Đảo Chuông):** Đảo R=45m 3 tầng (Y=0, Y=3, Y=6). 2 dốc góc 30° và 150°. Bục nhảy tại (0,3,13) bắn lên tầng 2. Tháp chuông trụ R=2m. Gió mạnh mỗi 30s thổi 5s hướng ngẫu nhiên đẩy 2 m/s. 7 đèn L1..L7. Bùa C1, C2.

## 3. Tiêu chí nghiệm thu Tính năng mới (Part 3)
- [ ] **AC-3.1 Gió Lạc (Drifter):** Tốc độ 7 m/s. Đuổi khi Mây mang $\ge 5$ đom đóm trong 15m. Chạm thì cướp $\min(3, \text{carried})$ rồi bỏ chạy (`flee`). Tỏa sáng trúng lúc flee thì thả lại đồ.
- [ ] **AC-3.2 Bùa Gió (Charm):** Tốc độ 7.2 m/s, Lướt không hồi chiêu trong 600 ticks. Hồi sinh sau 2700 ticks.
- [ ] **AC-3.3 Tạm dừng (Pause):** Nhận input `pause: true`. Tick tăng nhưng sim_tick, thời gian, cooldown đóng băng. Snapshot ghi `state: "paused"`.
