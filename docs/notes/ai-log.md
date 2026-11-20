# AI Usage Log & Token Management

## 1. Nguyên tắc sử dụng
- Thiết kế kế hoạch và kiểm tra ràng buộc trước khi viết code.
- Luôn kiểm chứng bằng test tự động và chạy thực tế, không chấp nhận lời khẳng định không có bằng chứng từ AI.

## 2. Nhật ký Phase 1
- **Hoạt động:** Khởi tạo kiến trúc phân tách Logic (Node 60Hz) và Renderer 3D (Three.js), triển khai Test Contract v1.0, kịch bản headless và bộ 5 unit test.
- **Phân tích lỗi của AI (Rubric D.2):**
  - *Lỗi phát sinh:* AI khởi tạo nhân vật Mây bằng cách dùng kiểm tra toán tử `new THREE.CapsuleGeometry ? ... : ...`. Trong JavaScript, `new` có thứ tự ưu tiên cao hơn toán tử điều kiện `?:`. Vì Three.js r128 chưa có constructor `CapsuleGeometry`, lệnh `new undefined` đã ném ra lỗi `TypeError: THREE.CapsuleGeometry is not a constructor`, khiến màn hình WebGL bị đen.
  - *Cách phát hiện & xử lý:* Kiểm tra thực tế trên trình duyệt thấy màn hình đen, inspect lỗi console và thay thế ngay bằng tổ hợp hình khối cơ bản chuẩn (`CylinderGeometry` làm thân, `SphereGeometry` làm đầu, `ConeGeometry` làm nón giữ đèn, `OctahedronGeometry` làm đèn lồng cầm tay).
- **Quản lý Token (Rubric D.3):**
  - Giữ prompt ngắn gọn, phân tách việc cụ thể, dùng built-in `node --test` không tốn chi phí cài đặt thư viện nặng.
  - Ước tính token sử dụng cho Phase 1: ~15,000 tokens.
