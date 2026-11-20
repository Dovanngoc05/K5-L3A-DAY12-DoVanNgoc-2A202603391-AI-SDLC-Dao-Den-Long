# Phase 3 Verification Matrix (Test Contract v1.2 — "Đèn cạn dầu")

| Yêu cầu Ticket-03 / Contract v1.2 | Phương pháp kiểm chứng | File bằng chứng / Test | Kết quả |
|---|---|---|:---:|
| **ADR Quyết định Thiết kế** | Ghi chép ADR số 0002 giải trình về cơ chế hao nhiên liệu, AI drain và luật Dawn Survival | `docs/adr/0002-lantern-fuel-and-dawn-survival.md` | **Đạt** |
| **Changelog Phiên bản** | Cập nhật CHANGELOG chi tiết các breaking change so với v1.1 | `CHANGELOG.md` | **Đạt** |
| **Nhiên liệu đèn & Hao hụt (1.0/s)** | Đèn sáng hao 1/60 fuel mỗi tick, hết dầu (<=0) tắt và phát `lantern_out` | `tests/simulation.test.js` | **Đạt** |
| **Thắp lại đèn (Relight: 5 đom đóm)** | Đèn `ever_lit` chỉ tốn 5 đom đóm, phục hồi fuel 100, thưởng +40 điểm | `tests/simulation.test.js` | **Đạt** |
| **Châm dầu (Refuel)** | Tương tác đèn đang sáng chưa đầy bù dầu, phát `refuel`, thưởng +5 điểm/đom đóm | `tests/simulation.test.js` | **Đạt** |
| **Bóng Mực hút dầu (AI Drain)** | Bóng Mực wander tìm đèn `fuel < 30`, cách <=2m chuyển sang `drain` hút 5 fuel/s, phát `fuel_drain` mỗi 60 tick | `tests/simulation.test.js` | **Đạt** |
| **Phản ứng Tỏa Sáng lên Bóng hút dầu** | Tỏa Sáng trúng bóng đang drain làm choáng và thưởng +15 điểm | `tests/simulation.test.js` | **Đạt** |
| **Sức chứa động (Dynamic Capacity)** | Tăng +2 mỗi lần thắp thành công (cả relight), trần 20 đom đóm | `tests/simulation.test.js` | **Đạt** |
| **Bãi bỏ Thắng sớm (No Early Win)** | Thắp đủ toàn bộ đèn không làm kết thúc game, vẫn ở trạng thái `playing` | `tests/simulation.test.js` | **Đạt** |
| **Luật Thắng Dawn Survival** | Sống sót tới bình minh (hết giờ) và số đèn đang sáng >= 60% (`dawn_survived`) | `tests/simulation.test.js` | **Đạt** |
| **Luật Thua Dawn / No Flames** | Hết giờ mà đèn < 60% thua `dawn`; hết lửa thua ngay lập tức `no_flames` | `tests/simulation.test.js` | **Đạt** |
| **Benchmark Hiệu năng (<= 30s)** | Mô phỏng 21,600 ticks (360s game) hoàn thành trong 88ms (<< 30s) | `tests/simulation.test.js` | **Đạt** |
| **Headless JSONL Contract v1.2** | Chạy mô phỏng Đêm 1, 2, 3 xuất đúng snapshot v1.2 (capacity, fuel, ever_lit, relit_count, state drain) | `docs/proof/out_night1_v1.2.jsonl`, `out_night2_v1.2.jsonl`, `out_night3_v1.2.jsonl` | **Đạt** |
| **Chế độ Hỗ trợ Mù màu (UI/Client)** | Mắt & aura bóng `#00B3FF`, cảnh báo `#FFFFFF` kèm `⚠`, đèn tắt dẹt 20% + tear marker, đèn yếu nhấp nháy 1 Hz | `src/client/index.html`, `src/client/game.js` | **Đạt** |
