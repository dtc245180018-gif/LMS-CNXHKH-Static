# ICTU LEARN — Chủ nghĩa xã hội khoa học

Hệ thống luyện tập LMS (giao diện tiếng Việt) chạy hoàn toàn bằng **HTML, CSS và JavaScript thuần**, không cần máy chủ, cơ sở dữ liệu hay thư viện bên ngoài. Có thêm trang đăng nhập và dashboard admin dạng static.

## Cách chạy

1. Giải nén file ZIP vào một thư mục trên máy.
2. Mở `index.html` bằng **Google Chrome, Microsoft Edge hoặc Firefox**.
3. Mở `login.html` nếu muốn đăng nhập; dùng tài khoản mẫu `student / student123` hoặc `admin / admin123`.
4. Chọn bài học, trả lời các câu hỏi, bấm **Kiểm tra câu này** hoặc **Nộp bài**.
5. Tài khoản admin có thể mở `admin.html` để xem thống kê, tạo và xóa tài khoản.

Để tiến độ được lưu, sử dụng cùng trình duyệt và cùng thư mục/tệp; tránh dùng chế độ ẩn danh hoặc xóa dữ liệu trang web.

## Nội dung được nhập từ tài liệu

| Bài | Số câu |
| --- | ---: |
| Bài 1 | 40 |
| Bài 2 | 39 |
| Bài 3 | 54 |
| Bài 4 | 40 |
| Bài 5 | 51 |
| Bài 6 | 27 |
| **Tổng** | **251** |

- **Chọn một đáp án** (radio), **chọn nhiều đáp án** (theo số lượng ghi ở đề, gồm chọn hai và chọn ba).
- **Đúng/Sai** với nhiều phát biểu trong cùng một câu.
- **Kéo thả ghép nối**: kéo hoặc chạm thẻ đáp án rồi chạm ô cần điền.
- **Kéo thả phân loại**: kéo hoặc chạm thẻ rồi chạm vào cột tương ứng.
- **Luyện tập**: chọn đáp án và kiểm tra theo từng câu.
- **Thi thử**: mỗi lượt thi sẽ xáo trộn thứ tự câu hỏi và các phương án trả lời, nộp bài để chấm và xem đáp án sau khi kết thúc. Số câu gốc trong tài liệu vẫn được hiển thị ở cuối tiêu đề từng câu.
- **Bài tổng hợp quản trị**: tài khoản admin có thể mở bài thi thử gồm toàn bộ 251 câu từ Dashboard admin; bài này luôn xáo trộn câu hỏi và đáp án, đồng thời dùng vùng lưu đáp án riêng.
- Điều hướng nhanh giữa các câu, tiến độ, điểm, thời gian, xem câu sai, **xuất kết quả CSV**, làm lại bài.
- Lưu tiến độ và kết quả bằng `localStorage` của trình duyệt (không đồng bộ máy khác).

**Lưu ý về dữ liệu:** Đáp án được nhập theo phần tô vàng và các chú thích đáp án trong file Word do người dùng cung cấp. Chưa đối chiếu/đính chính theo sách bên ngoài. Thứ tự và số câu giữ theo file, nên Bài 3 giữ nguyên khoảng nhảy từ câu 43 sang câu 45 (tài liệu không có câu 44).

## Các tệp

- `index.html`: trang giao diện.
- `style.css`: thiết kế giao diện responsive.
- `script.js`: toàn bộ logic học tập và chấm điểm.
- `questions.js`: ngân hàng câu hỏi chạy offline (được nạp trực tiếp bởi `index.html`).
- `questions.json`: ngân hàng 251 câu dạng JSON, dùng được khi muốn chỉnh sửa/tích hợp về sau.
- `login.html`, `auth.js`, `auth.css`: trang đăng nhập và lớp quản lý phiên đăng nhập.
- `admin.html`, `admin.js`: dashboard quản trị tài khoản.

Để cập nhật câu hỏi trên website, sửa **questions.js** (hoặc chỉnh questions.json rồi tạo lại questions.js theo định dạng `window.QUESTION_BANK = ...;`).

## GitHub Pages

Đây là website tĩnh nên có thể triển khai trực tiếp bằng GitHub Pages:

1. Tạo một repository GitHub và đưa toàn bộ các tệp trong thư mục này lên nhánh `main`.
2. Vào **Settings → Pages**, chọn **Deploy from a branch**, chọn `main` và thư mục `/ (root)`.
3. Sau khi GitHub hoàn tất triển khai, mở đường dẫn Pages và thêm `/login.html` để vào trang đăng nhập.

## Phạm vi và giới hạn bảo mật

Đăng nhập, mật khẩu và danh sách người dùng được lưu trong `localStorage` của trình duyệt hiện tại. Dashboard admin chỉ phù hợp cho demo, học tập hoặc chạy offline; không phải cơ chế xác thực an toàn và không đồng bộ giữa các thiết bị. Khi cần dùng thật, cần thay `auth.js` bằng backend có cơ sở dữ liệu, mã hóa mật khẩu và phân quyền phía máy chủ.
