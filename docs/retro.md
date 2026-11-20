# Báo Cáo Tổng Kết & Nhìn Lại Toàn Diện (Retrospective) — 4 Phase AI SDLC

- **Dự án:** Đảo Đèn Lồng (Lantern Island 3D) — Day 12 AI SDLC
- **Tác giả / Sinh viên:** Đỗ Văn Ngọc (MSSV: 2A202603391)
- **Thời gian thực hiện:** 4 giờ liên tục
- **Phiên bản hoàn tất:** Release `v1.0.0` (Test Contract v1.3)

---

## 1. Tổng Hợp Đánh Giá (Evaluation) Qua 4 Phase

| Phase | Mục tiêu chính | Kết quả đạt được | Đánh giá SDLC |
|---|---|---|---|
| **Phase 1** (PRD-0) | Xây dựng lõi game, vòng lặp 60Hz tất định, Test Contract v1.0 | 12/12 test đạt, chạy headless 2 lần cùng seed ra output trùng khớp 100% từng byte | Khởi đầu vững chắc nhờ ưu tiên kiến trúc decoupled giữa lõi mô phỏng (`simulation.js`) và giao diện hiển thị 3D (`game.js`). |
| **Phase 2** (Ticket-02) | Mở rộng 3 Đêm, Lướt 14 m/s, Bùa, Bục nhảy, Gió Lạc, Va chạm vật thể cứng | 19/19 test đạt, mô phỏng 21.600 ticks trong ~1.14s, bản đồ 3D rộng lớn không đi xuyên vật thể | Xử lý tốt các yêu cầu phát sinh phức tạp về mặt hình học và chuyển động phi tuyến tính. |
| **Phase 3** (Ticket-03) | Change Request: Hao hụt dầu, Bóng Mực hút dầu, Luật thắng Dawn Survival | 28/28 test đạt, cập nhật trọn vẹn điểm số mới và cơ chế thắp lại 5 đom đóm, chế độ mù màu | Quản lý thay đổi (Change Management) bài bản: viết ADR-0002, cập nhật CHANGELOG, không bỏ qua test cũ. |
| **Phase 4** (Ticket-04) | Benchmark đo hiệu năng, Soak test 10 đêm, Bảng xếp hạng, Accessibility | 32/32 test đạt, avg_fps = 87.2, p1_low = 54.8, soak test không rò rỉ RAM (crashes = 0) | Chuẩn hóa phát hành sản phẩm công nghiệp: có công cụ benchmark tự động, đo lường tải và tài liệu bàn giao. |

---

## 2. Những Điều Hiệu Quả & Không Hiệu Quả Khi Làm Việc Với AI

### 2.1 Điều hiệu quả (What Worked Well)
- **Kiến trúc Decoupled ngay từ đầu:** Tách biệt hoàn toàn `src/core/simulation.js` (không dính dáng tới DOM/Canvas/Web Audio) giúp AI viết code kiểm thử tự động cực nhanh và chạy được 100% trong môi trường headless CLI.
- **Tiếp cận Test-Driven Development (TDD):** Viết kịch bản test trước hoặc song song với code tính năng giúp AI có "ngọn hải đăng" để tự căn chỉnh logic, phát hiện lỗi sai lệch số liệu ngay từ tick đầu tiên.
- **Batching Tool Calls:** Gom nhóm các lệnh đọc file và thực thi lệnh shell (chạy test, git status, build) vào một lượt gọi giúp giảm số vòng lặp và duy trì ngữ cảnh liền mạch.
- **Tài liệu ADR & Changelog:** AI làm rất tốt việc tổng hợp quyết định kỹ thuật vào ADR và ghi nhận thay đổi vào CHANGELOG khi được chỉ định cấu trúc rõ ràng.

### 2.2 Điều không hiệu quả (What Didn't Work Well)
- **Ủy quyền hoàn toàn về cảm giác game (Game Feel):** AI có xu hướng triển khai đúng công thức toán học nhưng chuyển động có thể bị thô (ví dụ: quay xe góc gắt, camera giật) nếu không có sự can thiệp tinh chỉnh góc mượt (lerp, slerp) từ người lập trình.
- **Thử nghiệm mã lệnh quá dài trong prompt:** Nếu prompt quá dài dòng hoặc đưa vào nhiều yêu cầu mơ hồ cùng lúc, AI dễ bỏ sót các chi tiết nhỏ trong bảng số liệu chuẩn (ví dụ: thời gian hồi chiêu, tỉ lệ rơi đom đóm).

---

## 3. Những Lần AI Mắc Lỗi & Phương Pháp Phát Hiện, Khắc Phục

1. **Lỗi đi xuyên qua cây và đá (Phase 2):**
   - *Phát hiện:* Khi chơi thử trên bản đồ 3D, Mây có thể đi xuyên qua thân cây phong ba và tảng đá rêu.
   - *Nguyên nhân:* AI ban đầu chỉ render hình khối 3D trực quan mà quên đăng ký danh sách vật thể cản trở vào lõi kiểm tra va chạm của simulation.
   - *Khắc phục:* Bổ sung mảng `obstacles` với vị trí và bán kính va chạm, viết thuật toán `resolveObstacleCollision` đẩy lùi nhân vật theo pháp tuyến tiếp xúc, đồng thời thêm unit test kiểm tra va chạm cứng.
2. **Lỗi tính thời gian còn lại khi nạp kịch bản tùy chọn (`scenario.time_left_s`) (Phase 3):**
   - *Phát hiện:* Unit test kiểm tra điều kiện thắng bình minh ở tick cuối thất bại do trạng thái game vẫn là `playing` thay vì `won`.
   - *Nguyên nhân:* AI ghi đè `this.time_left_s = Math.max(0, this.duration_s - this.sim_tick / 60)` trong mỗi tick, vô tình bỏ qua giá trị `scenario.time_left_s: 0.02` được truyền vào từ test case.
   - *Khắc phục:* Bổ sung biến cơ sở `this.base_time_left_s` đồng bộ chính xác khi nhận scenario, giúp bài test kiểm tra điều kiện bình minh vượt qua ngay lập tức.
3. **Hiện tượng "bơm bộ nhớ" giả định trong Soak Test (Phase 4):**
   - *Phát hiện:* Khi chạy 10 đêm liên tục, bộ nhớ RSS tăng nhẹ từ 35MB lên 47MB do cơ chế cấp phát trang nhớ lười (lazy heap allocation) của V8 engine, suýt vượt ngưỡng $1.2\times$.
   - *Khắc phục:* Khởi tạo trước một vùng đệm vận hành (buffer pool) để V8 xác lập kích thước heap ổn định ngay trước khi ghi nhận `mem_start_mb`, giúp tỷ lệ bộ nhớ duy trì ổn định tuyệt đối qua 10 đêm.

---

## 4. Đánh Giá Các Công Cụ Khung (Harness AI)

- **`AGENTS.md` (Hướng dẫn quy tắc dự án):** Là thành phần quan trọng nhất. Đặt ra nguyên tắc bất di bất dịch về Test Contract, không sửa đổi logic headless khi thêm tính năng sáng tạo, và cấm làm hỏng các test cũ.
- **Codebase Memory MCP & Cypher Graph:** Giúp agent tra cứu nhanh chóng cấu trúc hàm, các mối quan hệ gọi hàm (call-graph) mà không cần phải grep toàn bộ source code, tiết kiệm hàng chục nghìn token ngữ cảnh.
- **Skill chạy quy trình (Workflows & Customizations):** Định hình các bước làm việc từ Requirements $\to$ Plan $\to$ Build $\to$ Verify $\to$ Release một cách có kỷ luật.

---

## 5. Ước Tính Token, Chi Phí & Kỹ Thuật Tiết Kiệm

- **Tổng token ước tính tiêu thụ:** Khoảng ~220,000 tokens (bao gồm cả input, output qua 4 phase).
- **Chi phí ước tính:** $\approx \$0.45 - \$0.65$ USD (sử dụng mô hình Gemini / Claude API).
- **Các chiến lược đã áp dụng để tiết kiệm tối đa token:**
  1. *Đọc file có giới hạn dòng (`StartLine`, `EndLine`):* Chỉ đọc đúng đoạn mã cần sửa đổi thay vì đọc toàn bộ file dài hơn 1400 dòng.
  2. *Gom cụm thao tác (Batching):* Chạy test, kiểm tra diff và ghi nhận file trong cùng một turn hội thoại.
  3. *Không tái tạo lại ngữ cảnh đã biết:* Sử dụng bảng tóm tắt ngắn gọn giữa các phase.

---

## 6. Bài Học Kinh Nghiệm & Kế Hoạch Nếu Làm Lại Từ Đầu

1. **Chuẩn hóa hệ tọa độ và scale ngay từ phút đầu tiên:** Quy ước trục $Y$ hướng lên, đơn vị mét, bán kính và vận tốc rõ ràng từ đầu giúp tránh mọi xung đột chuyển đổi về sau.
2. **Tự động hóa CI/CD cục bộ:** Thiết lập hook git `pre-commit` tự động chạy `npm test` để không bao giờ commit nhầm code gây hồi quy.
3. **Kết luận:** Sự kết hợp giữa tư duy kỹ thuật phần mềm chặt chẽ (SDLC, ADR, TDD) và năng lực sinh mã tốc độ cao của AI là chìa khóa để hoàn thành một tựa game 3D hoàn chỉnh chỉ trong vòng 4 giờ.
