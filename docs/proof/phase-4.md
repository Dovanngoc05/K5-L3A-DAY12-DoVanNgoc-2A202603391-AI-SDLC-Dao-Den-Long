# Phase 4 Verification Matrix (Test Contract v1.3 — "Bình minh: phát hành v1.0.0")

| Hạng mục Yêu cầu Ticket-04 | Phương pháp kiểm chứng | Tệp bằng chứng / Test | Kết quả |
|---|---|---|:---:|
| **Test Contract v1.3** | Khai báo `contract_version: "1.3"`, `bench_cmd`, `soak_cmd` trong `game.contract.json` | `game.contract.json` | **Đạt** |
| **Chế độ Benchmark tự động** | Chạy `node src/benchmark.js --seed 42 --duration 30 --out bench.json`, đo 200 quái, 100 đom đóm, cam quỹ đạo | `bench.json`, `tests/simulation.test.js` | **Đạt** |
| **Chỉ số Benchmark đạt ngưỡng** | `avg_fps = 87.2` ($\ge 60$), `p1_low_fps = 54.8` ($\ge 30$), `load_ms = 5` ($\le 10000$) | `bench.json` | **Đạt** |
| **Kiểm thử ổn định Soak Test** | Chạy `node src/soak.js --seed 7 --nights 10 --out soak.json`, mô phỏng 10 đêm xoay vòng | `soak.json`, `tests/simulation.test.js` | **Đạt** |
| **Chỉ số Soak Test đạt ngưỡng** | `crashes = 0`, `mem_end_mb = 46.9 MB <= 1.2 * 60.8 MB` (không rò rỉ bộ nhớ) | `soak.json` | **Đạt** |
| **Bảng xếp hạng cục bộ** | Lưu top 10 tại `data/leaderboard.json`, lọc tên 3-12 ký tự, sắp xếp score giảm dần và mốc thời gian | `tests/simulation.test.js`, `src/core/leaderboard.js` | **Đạt** |
| **Lệnh xuất BXH CLI** | Chạy `<run_cmd> --export-leaderboard out.json` hoặc qua `headless.js` xuất đúng JSON | `tests/simulation.test.js`, `src/client/server.js` | **Đạt** |
| **Tùy biến phím điều khiển** | Modal đổi phím trong UI, phát hiện trùng phím thời gian thực, khôi phục mặc định, lưu `localStorage` | `src/client/index.html`, `src/client/game.js` | **Đạt** |
| **Phụ đề & Chỉ báo thị giác** | Banner thông báo xuất hiện quái, cảnh báo gió, đếm ngược 10s, mũi tên định hướng mép màn hình | `src/client/index.html`, `src/client/game.js` | **Đạt** |
| **Giảm chuyển động (Reduced Motion)** | Checkbox tắt rung lắc camera và hiệu ứng chớp sáng màn hình | `src/client/index.html`, `src/client/game.js` | **Đạt** |
| **Cỡ chữ UI & Mù màu** | Cỡ chữ $\ge 18\text{px}$ trên 1280×720, tùy chọn chữ lớn và chế độ mù màu độ tương phản cao | `src/client/index.html` | **Đạt** |
| **Tài liệu phát hành & Quy trình** | Ghi nhận đầy đủ ADR-0003, CREDITS, LICENSE, CHANGELOG cả 4 phase, retro tổng hợp | `docs/adr/`, `CREDITS.md`, `LICENSE`, `CHANGELOG.md`, `docs/retro.md` | **Đạt** |
| **Độ phủ kiểm thử tự động** | 32/32 unit & integration tests vượt qua 100% | `npm test` | **Đạt** |
