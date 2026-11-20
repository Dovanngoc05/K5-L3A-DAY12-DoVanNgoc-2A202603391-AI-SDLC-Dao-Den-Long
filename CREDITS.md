# Lời Cảm Ơn & Nguồn Gốc Tài Nguyên (CREDITS)

Dự án **Đảo Đèn Lồng** (Day 12 — AI SDLC) được xây dựng và hoàn thiện bởi:
- **Tác giả / Sinh viên:** Đỗ Văn Ngọc (MSSV: 2A202603391)
- **Lớp / Trường:** VinUniversity — AI Software Engineering Lab Day 12

---

## 1. Công Cụ & Trợ Lý Trí Tuệ Nhân Tạo (AI Tools)
- **Google Antigravity:** Nền tảng điều phối agentic AI, hỗ trợ thực thi quy trình SDLC qua 4 phase, tự động hóa kiểm thử và kiểm chứng.
- **Claude (Anthropic) / Claude Artifact:** Nền tảng phát hành đề bài, Test Contract và trợ giảng AI đồng hành của khóa học.

---

## 2. Thư Viện Phần Mềm & Mã Nguồn Mở
- **Three.js (r128):** Thư viện đồ họa 3D WebGL hiển thị không gian ba hòn đảo, hiệu ứng ánh sáng động, đổ bóng mềm và mặt biển mây.
- **Node.js (v24):** Môi trường thực thi Javascript phía máy chủ và bộ runner kiểm thử tích hợp (`node:test`, `node:assert`).

---

## 3. Đồ Họa & Tạo Hình (3D Geometry & Assets)
- Toàn bộ hình học 3D trong game (nhân vật Mây mặc áo tơi đội nón lá, bạn đồng hành Lạc, Đèn Lồng Lớn, Bóng Mực, Gió Lạc, cổng Torii, cầu tre, tháp chuông, bục nhảy, đá rêu, cây phong ba) được xây dựng **hoàn toàn theo phương pháp thủ tục (Procedural Procedural Geometry)** từ các khối nguyên thủy của Three.js (Cylinder, Sphere, Box, Cone, Ring, Dodecahedron).
- **Không sử dụng bất kỳ file 3D model bên ngoài nào (.gltf, .obj, .fbx)**, giúp game tải nhanh tức thì (< 5ms), dung lượng siêu nhẹ và không phụ thuộc mạng.

---

## 4. Hệ Thống Âm Thanh (Audio)
- Toàn bộ hiệu ứng âm thanh (nhảy, lướt nhanh, nhặt đom đóm, thắp đèn, tỏa sáng) được tổng hợp thời gian thực bằng **Web Audio API** (Oscillator, Gain, Envelope ramping).
- **Không sử dụng bất kỳ file âm thanh ngoài nào (.mp3, .wav, .ogg)**.

---

## 5. Giấy Phép & Bản Quyền
- Dự án được phát hành theo giấy phép **MIT License**. Mọi quyền sáng tạo thuộc về tác giả và tuân thủ quy chế liêm chính học thuật của VinUniversity.
