# Kế hoạch thực hiện Day 12 — AI SDLC: Đảo Đèn Lồng

Nov 20, 2026 · @ngọc

Dựa trên repo GitHub (README, GUIDE, CHECKPOINTS, RULES, SUBMISSION, RUBRIC) và phần đầu nội dung Phase 1 (PRD-0) đọc được từ lab board.

## 1. Lịch 4 giờ và nguyên tắc chung

| Mốc | Sự kiện | Hạn tag |
| --- | --- | --- |
| 0h | Phát hành Phase 1 (PRD-0) + chuẩn bị | `phase-1` trước 1h |
| 1h | Phát hành Phase 2 (Ticket-02) | `phase-2` trước 2h |
| 2h | Phát hành Phase 3 (Ticket-03) | `phase-3` trước 2h30 |
| 2h30 | Phát hành Phase 4 (Ticket-04) | `phase-4` + Release `v1.0.0` + video trước 4h |
| 4h | Hết giờ lab, chốt bài | — |

Hết giờ mỗi phase: **gắn tag và đi tiếp dù chưa hoàn hảo** — phần ít tính năng nhưng có bằng chứng thật luôn hơn nhiều tính năng không kiểm chứng được.

**Ba điều cần nhớ xuyên suốt:**

- Game đúng yêu cầu khách hàng > game phức tạp hay đẹp. Làm đúng và chứng minh được trước, trau chuốt sau.
- Token có hạn — đốt nhiều không làm bài tốt hơn. Ngữ cảnh gọn, kế hoạch rõ, kiểm chứng sớm thường rẻ và đúng hơn để agent chạy liên tục.
- Bằng chứng là phần quan trọng nhất. "Agent bảo chạy rồi" không phải bằng chứng — phải có test, output headless, ảnh hoặc số đo thật, khớp đúng tag.

## 2. Checkpoint 0 — Chuẩn bị (làm trước khi đồng hồ Phase 1 chạy, nếu có thể)

- [ ] Đổi tên hoặc tạo repo GitHub **public**, đúng chuẩn: `K5-L3A-DAY12-DoVanNgoc-2A202603391-AI-SDLC-Dao-Den-Long` (repo hiện tại đã đúng tên).
- [ ] Chốt công cụ: engine 3D (gợi ý: Godot hoặc Three.js/Node nếu muốn web, hoặc Unity) + AI agent (Claude Code). Không ràng buộc công nghệ, miễn chạy được trên macOS/Linux.
- [ ] Cài đặt, chạy thử một "hello 3D" hoặc chương trình headless để chắc môi trường ổn **trước khi tính giờ Phase 1**.
- [ ] Đăng nhập claude.ai, mở lab board, thử tab Phase 1 và hỏi trợ giảng một câu để chắc hoạt động.
- [ ] Tạo cấu trúc ghi chép: `docs/notes/` (giả định, nhật ký AI, retro), `docs/proof/` (bằng chứng), `docs/demo/` (video).
- [ ] Tạo khung `AGENTS.md` rỗng (sẽ điền ở Phase 1) để agent luôn đọc được quy ước dự án.
- [ ] Kiểm tra lại hạn nộp theo thông báo của Coach.

**Tự kiểm:** clone repo sang thư mục khác, chạy được chương trình thử nghiệm.

## 3. Phase 1 (PRD-0) — kế hoạch chi tiết

**Cốt truyện:** Người chơi điều khiển **Mây**, người giữ đèn nhỏ tuổi của đảo. Sương đen nuốt ánh sáng đảo; Mây phải **thu thập đom đóm** rồi mang về **thắp lại các Đèn Lồng Lớn**. **Bóng Mực** (sinh vật mực đen) đuổi theo, chạm vào thì **mất máu**; Mây có thể **tỏa sáng** để xua chúng nhưng tốn ánh sáng — Bóng Mực sợ đèn. Thắp hết đèn = thắng; hết máu = thua. Có điểm số.

**Phạm vi Phase 1 (bắt buộc):**

- Một màn: "Đêm 1 – Đảo Bến" — đảo tròn, **5 Đèn Lồng Lớn**.
- Di chuyển, nhảy, camera 3D góc nhìn thứ ba.
- Đom đóm rải rác trên đảo, nhặt được.
- Nạp ánh sáng vào đèn để thắp đèn.
- Bóng Mực xuất hiện, đuổi người chơi.
- Cơ chế tỏa sáng để xua Bóng Mực (tốn ánh sáng).
- Thắng/thua, điểm số, HUD hiển thị thông tin cần thiết.
- **Test Contract v1.0** (chế độ headless) — bắt buộc chính xác để được chấm tự động.

⚠️ **Lưu ý quan trọng:** tôi chỉ đọc được phần đầu của trang lab board (cốt truyện + phạm vi ở trên); phần **nội dung đầy đủ mục Test Contract v1.0** (định dạng input/output, lệnh chạy headless cụ thể, các con số chính xác, danh sách bàn giao) bị lỗi mạng khi tải nên chưa lấy được. **Việc đầu tiên cần làm: mở lab board, đọc trực tiếp mục Test Contract v1.0 và dán nội dung đó vào đây hoặc vào `docs/notes/phase-1.md`** trước khi để agent viết code — vì contract quyết định kiến trúc (tách logic khỏi hiển thị).

**Giả định cần tự chốt (ghi lại trong `docs/notes/assumptions.md`):**

- Lượng máu tối đa, sát thương mỗi lần bị Bóng Mực chạm.
- Lượng ánh sáng tối đa, chi phí mỗi lần tỏa sáng, tốc độ hồi (nếu có).
- Số đom đóm cần cho mỗi lần thắp 1 đèn lồng.
- Số lượng/tốc độ di chuyển của Bóng Mực, bán kính phát hiện.
- Công thức tính điểm.
- Kích thước đảo, vị trí 5 đèn lồng.

**Thứ tự làm việc trong \~60 phút:**

1. (8–10 phút) Đọc PRD-0 hai lần, gạch chân chỗ bắt buộc chính xác (Test Contract) và chỗ mơ hồ; viết giả định + tiêu chí nghiệm thu kiểm chứng được cho từng yêu cầu ở trên.
2. (5 phút) Thiết kế kiến trúc tách **logic game** (state: máu, ánh sáng, điểm, số đèn đã thắp, vị trí Bóng Mực) khỏi **hiển thị 3D**, để chạy headless được theo Test Contract; lập kế hoạch với agent, duyệt trước khi code.
3. (25–30 phút) Build theo bước nhỏ: scaffold engine → nhân vật di chuyển/nhảy/camera → đom đóm + nhặt → đèn lồng + nạp sáng → Bóng Mực đuổi + va chạm + mất máu → tỏa sáng xua đuổi → thắng/thua/điểm/HUD → chế độ headless đọc input theo contract và in output đúng định dạng.
4. (10–12 phút) Kiểm chứng: tự viết vài scenario headless nhỏ, chạy và so khớp định dạng output; nếu contract yêu cầu tính tất định, chạy 2 lần cùng input và so sánh; chụp ảnh/GIF HUD, thắng/thua.
5. (3–5 phút) Ghi chú nhanh (đạt/chưa đạt), gắn tag `phase-1`, push.

## 4. Khung lặp lại cho Phase 2, 3, 4

Nội dung từng ticket chưa công bố (giống dự án thật) nên không đoán trước; nhưng **quy trình 8 bước** này áp dụng mỗi lần ticket mới ra:

1. **Đọc ticket.** So với giả định đã ghi ở phase trước — chỗ nào được làm rõ hoặc thay đổi thì cập nhật.
2. **Viết tiêu chí nghiệm thu** cho phần mới; nếu ticket nói rõ "luật cũ bị thay" (có thể xảy ra ở Phase 3), liệt kê ngay những test/giả định cũ bị ảnh hưởng.
3. **Nghĩ cách kiểm chứng trước khi code** (scenario headless, ảnh/GIF, số đo).
4. **Lập kế hoạch với agent, duyệt**, rồi mới code; quyết định lớn ghi 1 dòng lý do.
5. **Build theo bước nhỏ**, commit nhỏ, đọc diff.
6. **Chạy lại toàn bộ kiểm chứng của phase trước** sau khi tích hợp phần mới — đây là chỗ hay bị bỏ sót và mất điểm hạng mục A (test ẩn kiểm tra lại phase trước).
7. **Đánh giá nhanh:** yêu cầu nào đạt/chưa đạt, AI sai ở đâu, cần chỉnh harness gì (AGENTS.md / skill / hook).
8. **Gắn tag `phase-N`, push** trước hạn — dù chưa hoàn thiện.

**Phân bổ thời gian:** Phase 2 \~60 phút (như Phase 1); Phase 3 chỉ 30 phút — rút gọn bước build, ưu tiên xử lý đúng phần "thay thế luật cũ" và ghi lý do thay đổi thiết kế; Phase 4 có 90 phút — dành 10–15 phút cuối cho đo hiệu năng, làm sạch README, tạo Release `v1.0.0` và quay video.

**Rủi ro cần canh chừng:** ticket sau có thể thay đổi luật đã có (đặc biệt nhấn ở Phase 3) — khi đó test cũ bị sai phải **sửa hoặc bỏ kèm lý do**, tuyệt đối không tắt âm thầm (bị tính vi phạm trung thực nếu giấu).

## 5. Harness AI, kiểm chứng và bằng chứng

**Cấu trúc thư mục gợi ý (giữ nguyên trong lịch sử git, không xóa):**

```
AGENTS.md                 # lệnh build/test, quy ước, điều cấm — vài chục dòng, cập nhật khi agent sai lặp lại
.claude/skills/           # vd. skill "run-and-capture-evidence": chạy headless + lưu output/ảnh
.claude/settings.json     # hook: chạy test sau khi agent sửa file; chặn kết thúc khi test đỏ
src/                      # logic game tách khỏi hiển thị
tests/                    # unit test + scenario headless
docs/notes/               # giả định từng phase, nhật ký dùng AI (token/chi phí), retro
docs/proof/               # bằng chứng từng phase, đặt tên theo phase
docs/demo/demo.mp4        # nếu không đính kèm Release
CREDITS.md  LICENSE
```

**Bảng truy vết yêu cầu → bằng chứng (điền mỗi phase, đặt trong `docs/proof/phase-N.md`):**

| Yêu cầu | Cách kiểm chứng | Bằng chứng | Kết quả |
| --- | --- | --- | --- |
| vd. Thắp đủ 5 đèn → thắng | Scenario headless input cố định | `proof/phase1/win.json` + output | Đạt |
| vd. Chạm Bóng Mực → mất máu | Scenario + ảnh HUD | `proof/phase1/damage.png` | Đạt |
| … | … | … | Đạt / **Chưa đạt** (ghi lý do) |

**Nguyên tắc harness:** khi agent sai, sửa ở nơi chắc chắn nhất — ưu tiên kiểm tra tự động/hook hơn là thêm chỉ dẫn bằng lời; chỉ thêm skill/hook khi thấy agent lặp lại cùng lỗi, không thêm thừa (mỗi công cụ thêm context).

**Kiểm chứng tối thiểu mỗi phase:** unit test cho logic thuần; scenario headless cho hành vi game; chạy 2 lần cùng input để kiểm tính tất định (nếu contract yêu cầu); ảnh/GIF cho thứ chỉ nhìn mới thấy (HUD, hiệu ứng); số đo cho hiệu năng (Phase 4). CI (GitHub Actions chạy test mỗi push) là cách rẻ để có điểm "tự động hóa kiểm chứng" (mục B, 3 điểm) — nên dựng ngay từ Phase 1 nếu còn thời gian.

## 6. Quản lý token, nộp bài và việc cần làm ngay

**Quản lý token:** chia việc nhỏ, giữ `AGENTS.md` ngắn, dùng model nhẹ cho việc đọc/tìm/định dạng, model mạnh cho việc khó; dừng ngay khi agent đi lạc thay vì để chạy tiếp rồi dọn; ghi ước tính token/chi phí mỗi phase + cách đã tiết kiệm vào `docs/notes/ai-log.md` (có điểm ở mục D).

**Nộp bài cuối cùng cần có:** toàn bộ mã nguồn qua 4 phase + tag `phase-1..4` + Release `v1.0.0`; video demo `.mp4` dưới 5 phút; bằng chứng kiểm chứng từng phase; harness AI giữ nguyên trong lịch sử git; ghi chép (giả định, nhật ký AI, retro); không commit `.env`/API key.

Test Contract v1.0
Mọi bài nộp phải có một chế độ chạy không giao diện (headless) để giảng viên chạy kiểm thử tự động, bất kể công nghệ.

A. File game.contract.json ở gốc repo
{
  "contract_version": "1.0",
  "team": "mssv-ho-ten",
  "build_cmd": "lệnh cài đặt/biên dịch",
  "run_cmd": "lệnh mở game có giao diện",
  "headless_cmd": "lệnh chạy headless (sẽ được nối thêm tham số)",
  "tuning": {
    "player_speed": 0,
    "carry_capacity": 0,
    "lantern_cost": 0,
    "lantern_count_night1": 5,
    "pickup_radius": 0,
    "interact_radius": 0,
    "pulse_cost": 0,
    "pulse_radius": 0,
    "night1_duration_s": 0,
    "flames": 0,
    "invuln_s": 0,
    "hit_drop_ratio": 0,
    "pulse_stun_s": 0,
    "pulse_push_m": 0,
    "pulse_cooldown_s": 0,
    "safe_radius": 0,
    "shade_speed": 0,
    "shade_hit_radius": 0,
    "fall_enabled": false,
    "score": { "per_mote": 0, "per_lantern": 0, "per_stun": 0,
               "per_second_left": 0, "per_flame_left": 0 }
  }
}
tuning: bạn điền đúng các số mà game của bạn đang dùng. Nếu game không có khái niệm đó, điền null (hoặc false) và giải thích trong README. Bài test Phase 1 sinh tình huống dựa trên các số này, nên khai sai sẽ làm trượt test.
Ý nghĩa: hit_drop_ratio là tỉ lệ đom đóm đánh rơi khi bị chạm (0 nếu không rơi); safe_radius là bán kính quanh đèn mà Bóng Mực không vào được; fall_enabled cho biết rơi khỏi đảo có bị phạt hay không; score.* là điểm cho mỗi sự kiện.
Lệnh phải chạy được trên macOS/Linux sau build_cmd. Docker được phép.
B. Tham số headless
<headless_cmd> --seed <int> --night 1 [--scenario <file.json>] [--inputs <file.json>]
               --ticks <int> --out <file.jsonl> [--snapshot-every <int, mặc định 10>]
Logic game chạy ở 60 tick/giây cố định (1 tick = 1/60 giây), không cần cửa sổ, không cần GPU, nhanh nhất có thể.
Dừng khi chạy đủ --ticks hoặc khi game kết thúc (thắng/thua). Thoát với mã 0.
Lỗi → mã thoát khác 0, thông báo lỗi ra stderr. File inputs/scenario sai định dạng → mã thoát 2.
Đơn vị độ dài là mét; trục Y hướng lên; mặt đất đảo ở Y = 0; người chơi xuất phát tại (0, 0, 0).
Mô hình tick (để mọi bài đếm giống nhau)
Snapshot tick 0 là trạng thái sau khi dựng scenario, trước khi áp dụng input.
Bước thứ k (k = 0 … N−1) đọc input của tick k và tạo ra trạng thái k+1. Sự kiện xảy ra trong bước đó ghi tick = k+1. --ticks N thực hiện đúng N bước.
time_left_s = thời lượng Đêm − (số bước đã chạy) / 60.
Quy ước vị trí
player.pos là chân nhân vật; shade.pos là tâm Bóng Mực; lantern.pos là chân cột đèn; vị trí đom đóm là điểm trên mặt đất (độ cao lơ lửng chỉ là hiển thị).
Mọi khoảng cách trong tuning đo giữa các điểm này, theo mặt phẳng ngang XZ, không cộng thêm kích thước nhân vật. "Trong bán kính r" nghĩa là khoảng cách ≤ r.
C. File inputs
{
  "frames": [
    { "tick": 0,   "move": [0, 1], "cam_yaw_deg": 0 },
    { "tick": 120, "move": [0, 0], "interact": true },
    { "tick": 121, "interact": false },
    { "tick": 200, "pulse": true },
    { "tick": 201, "pulse": false }
  ]
}
Giá trị mặc định trước frame đầu tiên: move [0,0], cam_yaw_deg 0, mọi nút false.
Mỗi frame chỉ đổi các trường có mặt trong frame đó; trường vắng mặt giữ giá trị cũ.
tick của các frame phải tăng nghiêm ngặt (không trùng, không giảm).
move: [x, z], mỗi thành phần trong [−1, 1]. Với θ = cam_yaw_deg đổi sang radian, hướng di chuyển trong thế giới là x' = x·cosθ + z·sinθ, z' = −x·sinθ + z·cosθ (khi θ = 0 thì x là +X, z là +Z). Vector dài hơn 1 phải được chuẩn hóa về độ dài 1.
jump, interact, pulse (và dash nếu có): boolean, hành động kích hoạt khi giá trị chuyển từ false sang true.
Không có file inputs nghĩa là người chơi đứng yên.
D. File scenario (dựng tình huống cho test)
{
  "player": { "pos": [0, 0, 0], "carried": 0, "flames": 3 },
  "random_motes": false,
  "random_shades": false,
  "motes": [[0, 0, 5]],
  "shades": [{ "pos": [10, 0, 0] }],
  "lanterns": [{ "id": "L1", "pos": [0, 0, 25], "deposited": 0 }],
  "time_left_s": 300
}
random_motes: false: không tự sinh đom đóm, chỉ có những con được liệt kê.
random_shades: false: không tự sinh Bóng Mực, chỉ có những con được liệt kê (ở trạng thái hoạt động bình thường ngay lập tức).
lanterns: cập nhật theo id các đèn của màn (L1…L5). Đèn không được nhắc tới giữ nguyên; có pos thì đổi vị trí; có thể đặt lit: true.
motes, shades: thay thế danh sách ban đầu tương ứng; mảng rỗng nghĩa là không có con nào. shades[] có thể kèm id để test tham chiếu.
Trường nào không có thì dùng mặc định của game.
Dựng scenario không phát sự kiện và không cộng điểm (ví dụ đèn đặt sẵn lit: true không được cộng điểm thắp đèn).
E. Output JSONL
Mỗi dòng là một đối tượng JSON, gồm ba loại.

Snapshot, mỗi --snapshot-every tick, bắt đầu từ tick 0:

{"type":"snapshot","tick":120,"sim_tick":120,"state":"playing","time_left_s":298.0,"score":20,
 "player":{"pos":[0.0,0.0,12.0],"flames":3,"carried":2},
 "lanterns":[{"id":"L1","pos":[0,0,25],"lit":false,"deposited":0}],
 "shades":[{"id":"S1","pos":[30.1,1.0,2.0],"state":"chase"}],
 "motes_active":19}
Event, ghi ngay khi sự kiện xảy ra. Ví dụ: {"type":"event","tick":131,"name":"mote_picked","data":{"carried":3}}

name	data
mote_picked	{"carried": n}
deposit	{"lantern_id": "L1", "amount": n, "deposited": n}
lantern_lit	{"lantern_id": "L1"}
pulse	{"stunned_ids": ["S1"]}
player_hit	{"by": "shade" | "fall", "flames": n, "dropped": n}
shade_spawned	{"id": "S3"}
game_over	{"result": "won" | "lost", "reason": "all_lit" | "dawn" | "no_flames"}
End, dòng cuối cùng và bắt buộc: {"type":"end","ticks":4800,"state":"won","score":1730}

state thuộc playing, won, lost. Trạng thái Bóng Mực tối thiểu phải có stunned; các trạng thái khác do bạn đặt tên.
Tọa độ làm tròn 3 chữ số thập phân.
Tính tất định: cùng --seed, cùng scenario và cùng inputs phải cho output giống hệt nhau giữa hai lần chạy, kể cả các id tự sinh. Các bạn không cần sinh cùng chuỗi ngẫu nhiên với nhau.
sim_tick là số bước gameplay đã chạy (ở Phase 1 bằng tick).
Mảng motes (mỗi phần tử id, pos) trong snapshot là khuyến nghị ở v1.0.
Nếu một sự kiện không xảy ra trong game của bạn (ví dụ không có rơi khỏi đảo) thì không ghi sự kiện đó.

**Checklist nhanh trước khi tag mỗi phase:**

- [ ] Clone sạch, làm theo README, game chạy được.
- [ ] Chế độ headless chạy đúng Test Contract hiện hành.
- [ ] Mỗi yêu cầu chính có bằng chứng; chỗ chưa đạt ghi trung thực.
- [ ] Test phase trước vẫn chạy qua (hoặc sửa/bỏ kèm lý do nếu bị ticket mới thay).
- [ ] Tag đúng tên, đúng commit, đã push.
