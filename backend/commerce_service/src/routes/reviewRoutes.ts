import { Router } from 'express';
import { reviewController } from '../controllers/reviewController';
import { authMiddleware } from '../middlewares/auth'; 
import { roleMiddleware } from '../middlewares/role'; 

const router = Router();

// ==== PUBLIC APIs ====
router.get('/products/:productId/reviews', reviewController.getProductReviews);
router.get('/products/:productId/reviews/summary', reviewController.getReviewSummary);
router.get('/shops/:shopId/reviews/summary', reviewController.getShopReviewSummary);

// ==== CUSTOMER APIs ====
const customerAuth = [authMiddleware, roleMiddleware(['CUSTOMER'])];

router.post('/reviews', customerAuth, reviewController.createReview);
router.patch('/reviews/:reviewId', customerAuth, reviewController.updateReview);
router.delete('/reviews/:reviewId', customerAuth, reviewController.deleteReview);
router.get('/reviews/my', customerAuth, reviewController.getMyReviews);
router.get('/reviews/eligibility', customerAuth, reviewController.checkEligibility);

// ==== SELLER APIs ====
const sellerAuth = [authMiddleware, roleMiddleware(['SELLER'])];
router.get('/seller/reviews', sellerAuth, reviewController.getSellerReviews);

// ==== ADMIN APIs ====
const adminAuth = [authMiddleware, roleMiddleware(['ADMIN'])];

router.get('/admin/reviews', adminAuth, reviewController.getAdminReviews);
router.delete('/admin/reviews/:reviewId', adminAuth, reviewController.adminDeleteReview);

export default router;