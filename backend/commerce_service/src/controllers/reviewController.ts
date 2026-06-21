import { Request, Response } from 'express';
import { reviewService } from '../services/reviewService';
import { sendSuccess, sendError, createRequestId, HttpError } from '../utils/http';
import { parseRequiredBigInt, serializeBigInt } from '../utils/validation';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination';

const syncProductRating = async (productId: bigint) => {
  try {
    const summary = await reviewService.getReviewSummary(productId);

    const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || 'http://localhost:3002'; 
    
    await fetch(`${catalogServiceUrl}/api/catalog/internal/products/update-rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: Number(productId),
        averageRating: summary.averageRating,
        totalReviews: summary.totalReviews
      })
    });
  } catch (error) {
    console.error("Lỗi đồng bộ rating sang Catalog Service:", error);
  }
};

export const reviewController = {
  // 1. Public: Xem danh sách review của một sản phẩm
  async getProductReviews(req: Request, res: Response) {
    try {
      const productId = parseRequiredBigInt(req.params.productId, "productId");
      const paginationParams = parsePaginationQuery(req.query, { maxLimit: 50 });
      
      const rating = req.query.rating ? Number(req.query.rating) : undefined;
      const sort = (req.query.sort as string) || 'newest';

      const { reviews, total } = await reviewService.getProductReviews(
        productId, 
        paginationParams.page, 
        paginationParams.limit, 
        rating, 
        sort
      );

      return sendSuccess(res, {
        requestId: createRequestId(),
        message: "Lấy danh sách đánh giá thành công",
        data: { reviews: serializeBigInt(reviews) },
        pagination: buildPaginationMeta({ 
            page: paginationParams.page, 
            limit: paginationParams.limit, 
            total 
        })
      });
    } catch (error: any) {
      const statusCode = error instanceof HttpError ? error.statusCode : 400;
      return sendError(res, {
        statusCode,
        message: error.message || "Dữ liệu không hợp lệ",
        error: { 
          code: error.code || "INVALID_REQUEST",
          fieldErrors: error.fieldErrors
        }
      });
    }
  },

  // 2. Public: Xem tổng quan rating của sản phẩm
  async getReviewSummary(req: Request, res: Response) {
    try {
      const productId = parseRequiredBigInt(req.params.productId, "productId");
      const summary = await reviewService.getReviewSummary(productId);

      return sendSuccess(res, {
        requestId: createRequestId(),
        message: "Lấy thống kê đánh giá thành công",
        data: {
          productId: productId.toString(),
          ...summary
        }
      });
    } catch (error: any) {
      const statusCode = error instanceof HttpError ? error.statusCode : 400;
      return sendError(res, {
        statusCode,
        message: error.message || "Sản phẩm không hợp lệ",
        error: { code: error.code || "INVALID_PRODUCT" }
      });
    }
  },

  // 3. Customer: Tạo review sau khi mua hàng
  async createReview(req: Request, res: Response) {
    try {
      const customerId = BigInt((req as any).authUser.userId); 
      const orderItemId = parseRequiredBigInt(req.body.orderItemId, "orderItemId");
      const { rating, commentText, imageUrls } = req.body;

      if (rating === undefined || rating < 0 || rating > 5) {
        throw new HttpError(400, "Rating không hợp lệ", {
          code: "VALIDATION_ERROR",
          fieldErrors: [{ field: "rating", message: "Rating phải là số từ 0 đến 5" }]
        });
      }

      const review = await reviewService.createReview({
        customerId,
        orderItemId,
        rating,
        commentText,
        imageUrls
      });

      syncProductRating(review.productId);

      return sendSuccess(res, {
        requestId: createRequestId(),
        statusCode: 201, // Created
        message: "Đánh giá sản phẩm thành công",
        data: { review: serializeBigInt(review) }
      });
    } catch (error: any) {
      const statusCode = error instanceof HttpError ? error.statusCode : 400;
      return sendError(res, {
        statusCode,
        message: error.message || "Lỗi tạo đánh giá",
        error: { 
          code: error.code || "CREATE_REVIEW_FAILED",
          fieldErrors: error.fieldErrors 
        }
      });
    }
  },

  // 4. Customer: Cập nhật review của customer
  async updateReview(req: Request, res: Response) {
    try {
      const customerId = BigInt((req as any).authUser.userId);
      const reviewId = parseRequiredBigInt(req.params.reviewId, "reviewId");
      const { rating, commentText, imageUrls } = req.body;

      if (rating !== undefined && (rating < 0 || rating > 5)) {
        throw new HttpError(400, "Rating không hợp lệ", {
          code: "VALIDATION_ERROR",
          fieldErrors: [{ field: "rating", message: "Rating phải là số từ 0 đến 5" }]
        });
      }

      const review = await reviewService.updateReview(reviewId, customerId, { rating, commentText, imageUrls });

      if (rating !== undefined) {
        syncProductRating(review.productId);
      }
      
      return sendSuccess(res, {
        requestId: createRequestId(),
        message: "Cập nhật đánh giá thành công",
        data: { review: serializeBigInt(review) }
      });
    } catch (error: any) {
      const statusCode = error instanceof HttpError ? error.statusCode : 400;
      return sendError(res, {
        statusCode: error.message === "FORBIDDEN" ? 403 : statusCode,
        message: error.message || "Lỗi cập nhật đánh giá",
        error: { code: error.message === "FORBIDDEN" ? "FORBIDDEN" : "UPDATE_REVIEW_FAILED" }
      });
    }
  },

  // 5. Customer: Xóa review của customer
  async deleteReview(req: Request, res: Response) {
    try {
      const customerId = BigInt((req as any).authUser.userId);
      const reviewId = parseRequiredBigInt(req.params.reviewId, "reviewId");
      
      const deletedReview = await reviewService.deleteReview(reviewId, customerId);

      syncProductRating(deletedReview.productId);
      
      return sendSuccess(res, {
        requestId: createRequestId(),
        message: "Xóa đánh giá thành công",
        data: { deleted: true }
      });
    } catch (error: any) {
      const statusCode = error instanceof HttpError ? error.statusCode : 400;
      return sendError(res, {
        statusCode: error.message === "FORBIDDEN" ? 403 : statusCode,
        message: error.message || "Lỗi xóa đánh giá",
        error: { code: error.message === "FORBIDDEN" ? "FORBIDDEN" : "DELETE_REVIEW_FAILED" }
      });
    }
  },

  // 6. Customer: Xem review của chính mình
  async getMyReviews(req: Request, res: Response) {
    try {
      const customerId = BigInt((req as any).authUser.userId);
      const paginationParams = parsePaginationQuery(req.query, { maxLimit: 50 });

      const { reviews, total } = await reviewService.getMyReviews(
        customerId, 
        paginationParams.page, 
        paginationParams.limit
      );

      return sendSuccess(res, {
        requestId: createRequestId(),
        message: "Lấy danh sách đánh giá của tôi thành công",
        data: { reviews: serializeBigInt(reviews) },
        pagination: buildPaginationMeta({ 
            page: paginationParams.page, 
            limit: paginationParams.limit, 
            total 
        })
      });
    } catch (error: any) {
      const statusCode = error instanceof HttpError ? error.statusCode : 400;
      return sendError(res, {
        statusCode,
        message: error.message || "Lỗi lấy danh sách đánh giá",
        error: { code: error.code || "FETCH_REVIEWS_FAILED" }
      });
    }
  },

  // 7. Customer: Kiểm tra customer có được review order item không
  async checkEligibility(req: Request, res: Response) {
    try {
      const customerId = BigInt((req as any).authUser.userId);
      const orderItemId = parseRequiredBigInt(req.query.orderItemId, "orderItemId");
      const result = await reviewService.checkEligibility(orderItemId, customerId);
      const data: any = { canReview: result.canReview };
      if (result.reason) {
        data.reason = result.reason;
      }
      
      return sendSuccess(res, {
        requestId: createRequestId(),
        message: "Kiểm tra điều kiện thành công",
        data: data
      });
    } catch (error: any) {
      const statusCode = error instanceof HttpError ? error.statusCode : 400;
      return sendError(res, {
        statusCode,
        message: error.message || "Dữ liệu kiểm tra không hợp lệ",
        error: { 
          code: error.code || "CHECK_ELIGIBILITY_FAILED",
          fieldErrors: error.fieldErrors
        }
      });
    }
  }
};