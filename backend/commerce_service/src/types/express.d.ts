import "express";

/**
Đây là file mở rộng type cho Express Request.
Bình thường req.authUser không tồn tại trong type gốc của Express.
Sau khi khai báo augmentation, TypeScript hiểu rằng middleware auth sẽ gắn thêm authUser vào request.
Nếu bỏ file này:
Code runtime vẫn có thể chạy.
Nhưng TypeScript sẽ báo lỗi kiểu “Property authUser does not exist on type Request”.
File này giúp chúng ta tránh lỗi kiểu đó, và có thể truy cập req.authUser một cách an toàn trong code, không có thì trả về undifined.
 */
declare global {
    namespace Express {
        interface Request {
            authUser?: {
                userId: string;
                email: string;
                fullName: string;
                role: string;
                shopId?: string;
            };
        }
    }
}

export { };