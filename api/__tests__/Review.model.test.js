// Load Review model - mongoose is already loaded by Product tests
const Review = require('../db/models/Review');
const Enum = require('../config/Enum');

describe('Review Model Static Methods', () => {
    let mockReview;
    
    beforeEach(() => {
        mockReview = {
            find: jest.fn().mockReturnThis(),
            findByIdAndUpdate: jest.fn(),
            findOne: jest.fn(),
            aggregate: jest.fn(),
        };
        
        Review.find = mockReview.find;
        Review.findByIdAndUpdate = mockReview.findByIdAndUpdate;
        Review.findOne = mockReview.findOne;
        Review.aggregate = mockReview.aggregate;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test 11: findByProduct should find approved reviews for a product
    test('findByProduct should find approved reviews with comments', () => {
        const productId = '123456789012345678901234';
        const mockResults = [
            { _id: '1', product_id: productId, comment: 'Great product' }
        ];
        
        mockReview.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Review.findByProduct(productId);
        
        expect(mockReview.find).toHaveBeenCalledWith({
            product_id: productId,
            comment_status: Enum.REVIEW_STATUS.APPROVED,
            is_visible: true,
            comment: { $exists: true, $ne: null, $ne: '' }
        });
    });

    // Test 12: findPending should find reviews with pending comments
    test('findPending should find reviews with pending status', () => {
        const mockResults = [
            { _id: '1', comment_status: Enum.REVIEW_STATUS.PENDING }
        ];
        
        mockReview.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Review.findPending();
        
        expect(mockReview.find).toHaveBeenCalledWith({
            comment_status: Enum.REVIEW_STATUS.PENDING,
            comment: { $exists: true, $ne: null, $ne: '' }
        });
    });

    // Test 13: approveComment should update review status to approved
    test('approveComment should update review to approved status', () => {
        const reviewId = '123456789012345678901234';
        const approvedBy = '987654321098765432109876';
        const updatedReview = {
            _id: reviewId,
            comment_status: Enum.REVIEW_STATUS.APPROVED,
            is_visible: true
        };
        
        mockReview.findByIdAndUpdate.mockResolvedValue(updatedReview);

        return Review.approveComment(reviewId, approvedBy).then(result => {
            expect(mockReview.findByIdAndUpdate).toHaveBeenCalledWith(
                reviewId,
                expect.objectContaining({
                    comment_status: Enum.REVIEW_STATUS.APPROVED,
                    status: Enum.REVIEW_STATUS.APPROVED,
                    is_visible: true,
                    approved_by: approvedBy
                }),
                { new: true }
            );
        });
    });

    // Test 14: rejectComment should update review status to rejected
    test('rejectComment should update review to rejected status', () => {
        const reviewId = '123456789012345678901234';
        const approvedBy = '987654321098765432109876';
        const reason = 'Inappropriate content';
        const updatedReview = {
            _id: reviewId,
            comment_status: Enum.REVIEW_STATUS.REJECTED,
            is_visible: false,
            rejection_reason: reason
        };
        
        mockReview.findByIdAndUpdate.mockResolvedValue(updatedReview);

        return Review.rejectComment(reviewId, approvedBy, reason).then(result => {
            expect(mockReview.findByIdAndUpdate).toHaveBeenCalledWith(
                reviewId,
                expect.objectContaining({
                    comment_status: Enum.REVIEW_STATUS.REJECTED,
                    status: Enum.REVIEW_STATUS.REJECTED,
                    is_visible: false,
                    approved_by: approvedBy,
                    rejection_reason: reason
                }),
                { new: true }
            );
        });
    });

    // Test 15: getAverageRating should calculate average rating for a product
    test('getAverageRating should calculate average rating from reviews with ratings', () => {
        const productId = '123456789012345678901234';
        const mockAggregateResult = [
            { _id: null, averageRating: 4.5 }
        ];
        
        mockReview.aggregate.mockResolvedValue(mockAggregateResult);

        return Review.getAverageRating(productId).then(result => {
            expect(mockReview.aggregate).toHaveBeenCalledWith([
                { $match: { product_id: productId, rating: { $exists: true, $ne: null } } },
                { $group: { _id: null, averageRating: { $avg: "$rating" } } }
            ]);
        });
    });

    // Test 16: canUserReview should check if user can review a product
    test('canUserReview should check if user can review based on order delivery', () => {
        const customerId = '123456789012345678901234';
        const productId = '987654321098765432109876';
        const orderId = '111111111111111111111111';
        const mockReviewResult = { _id: '1', customer_id: customerId, product_id: productId };
        
        mockReview.findOne.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockReviewResult)
        });

        Review.canUserReview(customerId, productId, orderId);
        
        expect(Review.findOne).toHaveBeenCalledWith({
            customer_id: customerId,
            product_id: productId,
            order_id: orderId
        });
    });
});

