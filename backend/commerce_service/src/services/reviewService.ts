import { prisma } from '../config/prisma';

export const reviewService = {
  // 1. Lấy danh sách review của sản phẩm
  async getProductReviews(productId: bigint, page: number, limit: number, rating?: number, sort: string = 'newest') {
    const skip = (page - 1) * limit;
    
    const whereClause: any = { productId };
    if (rating !== undefined) whereClause.rating = rating;

    let orderByClause: any = { createdAt: 'desc' }; // default newest
    if (sort === 'oldest') orderByClause = { createdAt: 'asc' };
    if (sort === 'rating_desc') orderByClause = { rating: 'desc' };
    if (sort === 'rating_asc') orderByClause = { rating: 'asc' };

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.productReview.count({ where: whereClause })
    ]);

    return { reviews, total };
  },

  // 2. Thống kê Summary Rating
  async getReviewSummary(productId: bigint) {
    const reviews = await prisma.productReview.findMany({
      where: { productId },
      select: { rating: true }
    });

    const totalReviews = reviews.length;
    let averageRating = 0;
    const ratingBreakdown = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalReviews > 0) {
      let sum = 0;
      reviews.forEach(r => {
        sum += r.rating;
        ratingBreakdown[r.rating as keyof typeof ratingBreakdown] += 1;
      });
      averageRating = Number((sum / totalReviews).toFixed(1));
    }

    return { averageRating, totalReviews, ratingBreakdown };
  },

  // 3. Logic check điều kiện Review
  async checkEligibility(orderItemId: bigint, customerId: bigint) {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { order: true }
    });

    if (!orderItem) return { canReview: false, reason: "ORDER_ITEM_NOT_FOUND" };
    if (orderItem.order.customerId !== customerId) return { canReview: false, reason: "FORBIDDEN" };
    if (orderItem.order.orderStatus !== 'DELIVERED') return { canReview: false, reason: "ORDER_NOT_DELIVERED" };

    const existingReview = await prisma.productReview.findUnique({
      where: { orderItemId }
    });

    if (existingReview) return { canReview: false, reason: "ALREADY_REVIEWED" };

    return { canReview: true, orderItem };
  },

  // 4. Tạo Review mới
  async createReview(data: { customerId: bigint, orderItemId: bigint, rating: number, commentText?: string, imageUrls?: string[] }) {
    const eligibility = await this.checkEligibility(data.orderItemId, data.customerId);
    if (!eligibility.canReview) throw new Error(eligibility.reason);

    const { orderItem } = eligibility;

    return prisma.productReview.create({
      data: {
        customerId: data.customerId,
        productId: orderItem!.productId,
        shopId: orderItem!.order.shopId,
        orderItemId: data.orderItemId,
        rating: data.rating,
        commentText: data.commentText,
        imageUrls: data.imageUrls || [],
      }
    });
  },

  // Các hàm khác: Update, Delete, MyReviews...
  async getMyReviews(customerId: bigint, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productReview.count({ where: { customerId } })
    ]);
    return { reviews, total };
  },

  async updateReview(reviewId: bigint, customerId: bigint, data: any) {
    const review = await prisma.productReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error("REVIEW_NOT_FOUND");
    if (review.customerId !== customerId) throw new Error("FORBIDDEN");

    return prisma.productReview.update({
      where: { id: reviewId },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.commentText !== undefined && { commentText: data.commentText }),
        ...(data.imageUrls !== undefined && { imageUrls: data.imageUrls }),
      }
    });
  },

  async deleteReview(reviewId: bigint, customerId: bigint) {
    const review = await prisma.productReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error("REVIEW_NOT_FOUND");
    if (review.customerId !== customerId) throw new Error("FORBIDDEN");

    await prisma.productReview.delete({ where: { id: reviewId } });
    return true;
  }
};