# Phase 1 Verification Matrix (Test Contract v1.0)

| Yêu cầu Test Contract v1.0 | Phương pháp kiểm chứng | File bằng chứng / Test | Kết quả |
|---|---|---|:---:|
| **Khởi tạo & Cấu hình hợp đồng** | `game.contract.json` tại root khai báo `build_cmd`, `run_cmd`, `headless_cmd`, `tuning` | `game.contract.json` | **Đạt** |
| **Vòng lặp 60Hz & Tính tất định** | Chạy headless 2 lần cùng seed, so sánh từng byte (`0 differences`) | `docs/proof/phase1-determinism.log` | **Đạt** |
| **Đơn vị & Mô hình Tick** | Tick 0 snapshot trước bước 1, step k nhận input k sinh event tại k+1 | `tests/simulation.test.js` | **Đạt** |
| **Nhặt đom đóm (mote_picked)** | Scenario có mote trong bán kính 1.5m (`carried++`, `score +10`) | `tests/simulation.test.js` | **Đạt** |
| **Nạp & Thắp đèn (deposit, lantern_lit)** | Nạp 3 đom đóm vào L1 (`deposited=3`, `lit=true`, `score +100`) | `tests/simulation.test.js` | **Đạt** |
| **Tỏa sáng xua đuổi (pulse)** | Pulse làm choáng Bóng Mực (`stunned`), đẩy lùi 3m (`score +20`) | `tests/simulation.test.js` | **Đạt** |
| **Va chạm Bóng Mực (player_hit)** | Chạm Mây mất 1 flame, rớt 50% đom đóm mang theo (`dropped`) | `tests/simulation.test.js` | **Đạt** |
| **Vùng an toàn quanh đèn (safe_radius)** | Đèn đã thắp tạo bán kính 3.0m Bóng Mực không thể xâm nhập | `tests/simulation.test.js` | **Đạt** |
| **Tính nghiêm ngặt của input frame** | Kiểm tra tick tăng nghiêm ngặt (không trùng/giảm), báo lỗi mã thoát 2 | `tests/simulation.test.js` | **Đạt** |
| **CLI Headless & Mã thoát (Exit Codes)** | Chạy thực tế CLI: thoát mã 0 khi hoàn thành, thoát mã 2 khi input lỗi | `tests/simulation.test.js` | **Đạt** |
| **Chuẩn JSONL: snapshot, event, end** | Sinh đúng schema snapshot, event theo thời gian thực và dòng end cuối | `docs/proof/sample_out.jsonl` | **Đạt** |
