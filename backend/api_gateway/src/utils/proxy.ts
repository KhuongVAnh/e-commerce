import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { Request, Response } from "express";

export function createServiceProxy(target: string) {
    return createProxyMiddleware({
        target, // vd: http://auth-service:3001
        changeOrigin: true, // đổi origin của request thành origin của target (thường dùng khi target có kiểm tra CORS)
        pathRewrite: (_path: string, req: Request) => req.originalUrl,
        on: { // đăng ký hàm chạy trước khi gửi request tới service, 
            // Gắn thêm header Authorization và x-request-id vào request gửi đi, nếu chúng tồn tại ở request gốc
            // thư viện sẽ tự gọi hàm này trước khi gửi req đi với 3 tham
            proxyReq(proxyReq: any, req: Request, res: Response) {
                const authorization = req.header("authorization");
                const requestId = req.header("x-request-id") || res.locals.requestId;
                
                if (authorization) {
                    proxyReq.setHeader("authorization", authorization);
                }
                
                if (requestId) {
                    proxyReq.setHeader("x-request-id", requestId);
                }
                
                // fixRequestBody giúp giữ nguyên body của request khi proxy, tránh bị mất body khi gửi đi (đặc biệt với POST/PUT/PATCH)
                fixRequestBody(proxyReq, req);
            },
        },
    });
}