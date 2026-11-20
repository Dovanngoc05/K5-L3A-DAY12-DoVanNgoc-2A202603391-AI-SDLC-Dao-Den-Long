# Day 12 — AI SDLC: Đảo Đèn Lồng

> **Cá nhân** (1 người / 1 MSSV) · Áp dụng SDLC cùng AI để xây một **game 3D** qua **4 phase**, từ yêu cầu ban đầu tới bản phát hành.
> **Lab board + trợ giảng:** **[Đảo Đèn Lồng Lab](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW)**

---

## Tài liệu của lab

| File | Nội dung |
|---|---|
| [GUIDE.md](GUIDE.md) | Hướng dẫn làm lab: vòng làm việc mỗi phase, harness, kiểm chứng, token |
| [CHECKPOINTS.md](CHECKPOINTS.md) | Các mốc tự kiểm tra từ chuẩn bị đến nộp bài |
| [SUBMISSION.md](SUBMISSION.md) | Đặt tên repo, hạn nộp, tag, Release, video, checklist |
| [RULES.md](RULES.md) | Quy định: AI, trung thực về bằng chứng, bản quyền, bảo mật |
| [RUBRIC.md](RUBRIC.md) | Thang điểm chi tiết |

## Lab board

Yêu cầu dự án được phát hành tại **[Đảo Đèn Lồng Lab](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW)**. Mỗi phase là một tab (tab chưa phát hành bị khóa), mỗi tab có trợ giảng AI riêng chỉ trả lời trong phạm vi phase đó. Trợ giảng cần đăng nhập claude.ai và dùng lượt Claude của bạn.

## Dự án

**Đảo Đèn Lồng**: game 3D góc nhìn thứ ba. Mây, người giữ đèn nhỏ tuổi, gom đom đóm để thắp lại các Đèn Lồng Lớn và né Bóng Mực trong sương đen.

- Không ràng buộc công nghệ; chạy được trên macOS hoặc Linux.
- Tuân theo **Test Contract** (chế độ headless) để được chấm tự động và so sánh với nhau.

| Phase | Bạn nhận | Nộp |
|---|---|---|
| 1 | **PRD-0** (mô tả tổng quát) + Test Contract | tag `phase-1` |
| 2 | **Ticket-02**, phát hành khi Phase 1 kết thúc | tag `phase-2` |
| 3 | **Ticket-03** ("Đèn cạn dầu") + Test Contract v1.2 | tag `phase-3` |
| 4 | **Ticket-04**, phát hành khi Phase 3 kết thúc | tag `phase-4` + Release `v1.0.0` |

Yêu cầu sẽ được bổ sung và có thể thay đổi giữa các phase, giống dự án thật.

### Lịch 4 giờ

Bài lab kéo dài **4 giờ**. Phase 1 và 2 khoảng **1 giờ**, Phase 3 khoảng **30 phút**, Phase 4 khoảng **1 giờ 30 phút**. Mỗi phase phát hành đúng mốc giờ. Phase mới xuất hiện trên lab board khi tới mốc.

| Mốc | Sự kiện | Hạn tag |
|---|---|---|
| 0h | Phát hành **Phase 1** (PRD-0), gồm cả phần chuẩn bị | `phase-1` trước mốc 1h |
| 1h | Phát hành **Phase 2** | `phase-2` trước mốc 2h |
| 2h | Phát hành **Phase 3** | `phase-3` trước mốc 2h30 |
| 2h30 | Phát hành **Phase 4** | `phase-4`, Release `v1.0.0` và video trước mốc 4h |
| 4h | Hết giờ lab, chốt bài | |

Hết giờ mỗi phase thì tag và chuyển sang phase tiếp theo, dù phase chưa hoàn hảo. Chỗ chưa xong ghi trung thực trong bằng chứng.

---

## Gợi ý SDLC (cách làm là của bạn)

Mỗi phase là một vòng nhỏ. Công cụ, thứ tự, định dạng tài liệu đều tự do; đây chỉ là gợi ý:

1. **Requirements:** biến yêu cầu thành tiêu chí nghiệm thu kiểm chứng được. Chỗ mơ hồ thì tự giả định và ghi lại.
2. **Plan:** nghĩ cách kiểm chứng **trước** khi để agent viết code.
3. **Build:** để agent viết, bạn điều phối và review.
4. **Verify:** chạy thật, kiểm tra hành vi thật. *Không có bằng chứng thì chưa xong*: "agent bảo chạy rồi" không phải bằng chứng.
5. **Evaluate:** cái gì đạt, AI sai ở đâu, harness (AGENTS.md, skill, hook) cần chỉnh gì.
6. **Release:** gắn tag.

## Ba điều cần nhớ

> Bạn được **tự do sáng tạo thêm** quanh phần lõi (nhân vật, cơ chế nhỏ, câu chuyện, hiệu ứng, âm thanh…). Sáng tạo gọn và không phá yêu cầu được tính điểm trong hạng mục F của [RUBRIC](RUBRIC.md); ghi mục "Sáng tạo của tôi" trong README của bạn.

- **Game tốt là game đúng yêu cầu của khách hàng**, không phải game phức tạp hay đẹp nhất. Làm đúng và chứng minh được là đúng trước, trau chuốt sau.
- **Cân nhắc kỹ quota token của bạn.** Đốt nhiều token không làm bài tốt hơn. Ngữ cảnh gọn, kế hoạch rõ, kiểm chứng sớm thường vừa rẻ vừa đúng hơn chạy agent liên tục.
- **Kiểm chứng là phần quan trọng nhất.** Bằng chứng (test, output headless, ảnh, số đo) đáng giá hơn lời mô tả.

---

## Bàn giao cuối cùng

Một **repo GitHub cá nhân, public**, gồm:

1. **Toàn bộ mã nguồn** của game qua 4 phase, tag `phase-1` … `phase-4`, Release `v1.0.0`.
2. **Video demo `.mp4` dưới 5 phút** (đính kèm Release `v1.0.0` hoặc `docs/demo/demo.mp4`, link ở đầu README): chơi thử và cho thấy bằng chứng game chạy đúng.
3. **Bằng chứng kiểm chứng** của từng phase (định dạng tự chọn).
4. **Harness AI đã dùng** (AGENTS.md / CLAUDE.md, skills, hooks, plugins…), giữ nguyên trong repo và lịch sử git.
5. **Ghi chép ngắn:** spec/giả định mỗi phase, nhật ký dùng AI (gồm token/chi phí ước tính), retro.

Không commit API key, token hay `.env`. Gửi link repo theo hướng dẫn của Coach.

## Đánh giá (100 điểm)

| Hạng mục | Điểm |
|---|---|
| Test tự động ẩn (headless, gồm kiểm tra lại phase trước) | 30 |
| Kiểm chứng & bằng chứng của bạn | 20 |
| Quy trình SDLC & harness AI | 15 |
| Evaluation & retro (gồm cách bạn dùng token) | 10 |
| Hiệu năng & ổn định | 10 |
| Chất lượng sản phẩm (đúng yêu cầu, chơi được) | 10 |
| Video demo | 5 |

## Sáng tạo của tôi & Cập nhật Phase 3 ("Đèn cạn dầu")

### 1. Luật Chơi & Cơ Chế Cốt Lõi Phase 3 (Ticket-03 — Test Contract v1.2)
- **Nhiên liệu Đèn Lồng (`fuel`):** Đèn có thanh dầu tối đa 100, hao hụt tự nhiên 1.0 đơn vị/giây (1/60 mỗi tick). Khi hết dầu (`fuel <= 0`), đèn tắt và phát sự kiện `lantern_out`.
- **Thắp lại đèn (`ever_lit`):** Đèn từng thắp chỉ tốn **5 đom đóm** để thắp lại (thay vì 10) và được cộng +40 điểm.
- **Châm dầu (`refuel`):** Đèn đang sáng chưa đầy dầu có thể châm thêm bằng phím `E` (`used = min(carried, ceil((100 - fuel)/10))`), nạp +10 fuel/đom đóm và thưởng +5 điểm/đom đóm.
- **Bóng Mực hút dầu (`drain`):** Đèn có `fuel < 30` bị mất vùng an toàn. Bóng Mực ở trạng thái `wander` sẽ săn tìm đèn yếu và hút 5 fuel/giây. Tỏa Sáng trúng bóng đang hút dầu được thưởng lớn **+15 điểm**.
- **Luật Thắng Mới (Dawn Survival):** Bãi bỏ cơ chế thắng sớm khi thắp hết đèn! Người chơi phải sống sót đến khi hết giờ (bình minh) và giữ số đèn đang sáng $\ge 60\%$ tổng đèn (`dawn_survived`).
- **Sức chứa Đom đóm động:** Tăng thêm +2 sức chứa sau mỗi lần thắp thành công, nâng giới hạn từ 10 lên tối đa 20 đom đóm.
- **Chế độ Hỗ trợ Mù màu (Colorblind Mode):** Tích hợp nút chuyển chế độ ngay trên thanh điều khiển. Mắt & aura Bóng Mực đổi sang màu xanh cyan `#00B3FF`, cảnh báo màu trắng `#FFFFFF` kèm icon `⚠`, đèn tắt dẹt 20% và hiển thị ký hiệu giọt nước.

### 2. Các Yếu Tố Sáng Tạo (Hạng mục F)
1. **Linh Hồn Đồng Hành — Bé Đom Đóm Hoàng Kim "Lạc" (*Spiritual Companion*):** Bay theo sau Mây, đổi đỏ cảnh báo khi Bóng Mực áp sát trong 8m.
2. **Hệ Thống Âm Thanh Procedural Tự Sinh (*Web Audio API*):** Âm thanh nhảy, nhặt đom đóm, thắp/châm đèn, lướt và tỏa sáng không phụ thuộc asset ngoài.
3. **Môi Trường Ba Hòn Đảo Mở Rộng & Sống Động:** Đảo Bến (Đêm 1), Đảo Cau (Đêm 2 - bục nhảy ballistic), Đảo Chuông (Đêm 3 - tháp chuông 8m & gió cuốn). Biển mây 1600m x 1600m, bãi đá san hô, đèn trời xa xăm và điều khiển zoom camera.
4. **Vật Thể Đá, Cây & Cản Va Chạm Thực Tế:** Đẩy lùi va chạm bề mặt, tuyệt đối không cho phép đi xuyên qua vật thể.

---

## Hướng dẫn cài đặt & Chạy game

### 1. Khởi động giao diện 3D
```bash
npm start
# Mở trình duyệt tại: http://localhost:3000
```
* **W / A / S / D**: Di chuyển Mây.
* **Space**: Nhảy (Jump).
* **Shift**: Lướt nhanh (Dash) 14 m/s.
* **E**: Thắp đèn / Châm dầu.
* **Q** hoặc **F**: Tỏa sáng (Pulse).
* **P** hoặc **Esc**: Tạm dừng (Pause / Resume).
* **👁 Mù màu**: Nhấp để Bật/Tắt chế độ hỗ trợ mù màu.
* **Con lăn chuột (Scroll Wheel)**: Phóng to / thu nhỏ camera.
* **Thanh chọn Đêm**: Chuyển nhanh giữa Đêm 1, 2, 3.

### 2. Chạy kiểm thử tự động (28 Test Scenarios)
```bash
npm test
```

### 3. Chạy chế độ Headless (Test Contract v1.2)
```bash
node src/headless.js --seed 42 --night 1 --ticks 600 --out docs/proof/out_night1_v1.2.jsonl
node src/headless.js --seed 42 --night 2 --ticks 600 --out docs/proof/out_night2_v1.2.jsonl
node src/headless.js --seed 42 --night 3 --ticks 600 --out docs/proof/out_night3_v1.2.jsonl
```
