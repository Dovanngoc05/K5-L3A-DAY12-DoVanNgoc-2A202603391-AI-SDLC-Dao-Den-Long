# ADR 0002: Mô hình Nhiên liệu Đèn và Luật Thắng Bình Minh (Ticket-03 / Phase 3)

## Trạng thái
Đã chấp thuận (Accepted)

## Bối cảnh
Trong Phase 1 và Phase 2, game kết thúc ngay lập tức ("thắng sớm") khi toàn bộ Đèn Lồng Lớn được thắp sáng (`all_lit`). Đèn sau khi thắp sáng sẽ tồn tại vĩnh viễn và tạo vùng an toàn bất khả xâm phạm bán kính 6.0m đối với Bóng Mực.
Kết quả playtest cho thấy người chơi có kỹ năng cao có thể thắp hết toàn bộ đèn chỉ trong 2 phút đầu tiên, khiến nửa sau của Đêm trở nên nhạt nhẽo và hoàn toàn thiếu vắng sự căng thẳng. 

Nhà thiết kế game đã phát hành **TICKET-03 (Change Request)** nhằm biến lối chơi từ "chạy đua thắp hết đèn" thành **"chiến lược sinh tồn và duy trì ngọn lửa đến bình minh"**.

## Quyết định thiết kế

### 1. Mô hình vòng đời và nhiên liệu của Đèn Lồng (Lantern Fuel Lifecycle)
* **Nhiên liệu (`fuel`):** Mỗi đèn có dung lượng tối đa `fuel_max = 100`.
* **Hao hụt tự nhiên:** Khi đèn đang sáng, nhiên liệu tự động giảm `1.0 đơn vị/giây` (`1/60` mỗi tick). Để tránh sai số số thực trong mô phỏng tick-based, lõi mô phỏng theo dõi nhiên liệu theo phân số nguyên `1/60` và làm tròn số thập phân khi xuất snapshot.
* **Cạn dầu (`fuel <= 0`):** Đèn chuyển về trạng thái tắt (`lit = false`), `deposited = 0`, phát sự kiện `lantern_out`. Đèn ghi nhớ cờ `ever_lit = true`.
* **Thắp lại (*Relight*):** Đèn đã từng sáng (`ever_lit = true`) chỉ tốn **5 đom đóm** để thắp lại (thay vì 10). Khi thắp lại thành công, nhiên liệu hồi đầy về `100`, phát sự kiện `lantern_lit { lantern_id, relight: true }`.
* **Châm dầu (*Refuel*):** Người chơi có thể tương tác với đèn đang sáng nếu `fuel < 100`. Mỗi đom đóm châm thêm 10 nhiên liệu. Đèn đầy dầu sẽ bị bỏ qua khi tương tác.

### 2. Hành vi Bóng Mực hút dầu (Shade Fuel Draining)
* **Mất vùng an toàn:** Đèn có `fuel < 30` bị mất hoàn toàn vùng an toàn 6.0m (đúng 30 vẫn an toàn).
* **AI hút dầu (`drain`):** Bóng Mực ở trạng thái `wander` sẽ ưu tiên di chuyển về phía đèn yếu (`fuel < 30`) gần nhất. Khi tiếp cận $\le 2\text{m}$, Bóng Mực chuyển sang trạng thái mới `drain`, đứng yên và hút `5.0 fuel/giây` liên tục.
* **Đẩy lùi khi hồi phục an toàn:** Nếu đèn được châm dầu lên $\ge 30$, các Bóng Mực trong vùng 6.0m sẽ bị đẩy lùi ra mép trong tối đa 30 ticks mà không gây sát thương cho người chơi.

### 3. Luật thắng mới: Sống sót đến bình minh (Dawn Survival)
* **Bãi bỏ luật thắng sớm:** Thắp sáng toàn bộ đèn không còn kết thúc màn chơi ngay lập tức.
* **Điều kiện thắng mới (`dawn_survived`):** Người chơi phải sống sót đến khi hết giờ (Đêm 1: 240s, Đêm 2: 270s, Đêm 3: 300s) VÀ số đèn còn sáng tại tick cuối cùng phải đạt tối thiểu **60% tổng số đèn** (`ceil(0.6 * total_lanterns)`):
  - Đêm 1: $\ge 3 / 5$ đèn.
  - Đêm 2: $\ge 4 / 6$ đèn.
  - Đêm 3: $\ge 5 / 7$ đèn.
* **Điều kiện thua:** 
  - Hết Ngọn Lửa (`flames == 0`) $\to$ thua ngay lập tức với lý do `no_flames`.
  - Hết giờ mà số đèn sáng $< 60\%$ $\to$ thua với lý do `dawn`.

### 4. Sức chứa tăng tiến (Dynamic Capacity)
* Sức chứa tối đa ban đầu là 10.
* Mỗi lần thắp đèn thành công trong Đêm (kể cả thắp lại), sức chứa tăng thêm 2:
  $$\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$$

### 5. Cải tổ hệ thống tính điểm
* Nạp đom đóm vào đèn (thắp mới, thắp lại hoặc châm dầu): `+5` điểm/con.
* Thắp mới lần đầu: `+100` điểm. Thắp lại: `+40` điểm.
* Tỏa Sáng trúng Bóng Mực: `+5` điểm (nếu con đó đang hút dầu: `+15` điểm).
* Khi thắng lúc bình minh: `+50 + floor(fuel)` cho mỗi đèn đang sáng, `+50` cho mỗi Ngọn Lửa còn lại. Bỏ thưởng thời gian còn lại.

## Hệ quả & Kế hoạch chuyển đổi test (Migration Plan)
1. **Sửa các test cũ phụ thuộc vào thắng sớm `all_lit`:** Cập nhật sang kiểm tra trạng thái duy trì đèn đến tick cuối cùng.
2. **Sửa các test phụ thuộc vào công thức điểm cũ:** Cập nhật điểm nạp đèn là +5, điểm thắp lại là +40, điểm choáng quái hút dầu là +15.
3. **Thêm test cases mới:** Nhiên liệu giảm dần, sự kiện `lantern_out`, thắp lại tốn 5 đom đóm, Bóng Mực hút dầu, bão hòa sức chứa, và điều kiện thắng 60% đèn lúc bình minh.
