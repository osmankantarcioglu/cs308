// Load Discount model
const Discount = require('../db/models/Discount');

describe('Discount Model Static Methods', () => {
    let mockDiscount;
    
    beforeEach(() => {
        mockDiscount = {
            find: jest.fn().mockReturnThis(),
            findByIdAndUpdate: jest.fn(),
        };
        
        Discount.find = mockDiscount.find;
        Discount.findByIdAndUpdate = mockDiscount.findByIdAndUpdate;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test 31: findActive should find active discounts within date range
    test('findActive should find discounts that are active and within date range', () => {
        const mockResults = [
            { _id: '1', name: 'Summer Sale', is_active: true }
        ];
        
        mockDiscount.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Discount.findActive();
        
        const now = new Date();
        expect(mockDiscount.find).toHaveBeenCalledWith({
            is_active: true,
            start_date: { $lte: expect.any(Date) },
            end_date: { $gte: expect.any(Date) }
        });
    });

    // Test 32: findByProduct should find active discounts for a product
    test('findByProduct should find active discounts for specific product', () => {
        const productId = '123456789012345678901234';
        const mockResults = [
            { _id: '1', name: 'Product Discount', products: [{ product_id: productId }] }
        ];
        
        mockDiscount.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Discount.findByProduct(productId);
        
        const now = new Date();
        expect(mockDiscount.find).toHaveBeenCalledWith({
            'products.product_id': productId,
            is_active: true,
            start_date: { $lte: expect.any(Date) },
            end_date: { $gte: expect.any(Date) }
        });
    });

    // Test 33: findNotNotified should find active discounts without notifications
    test('findNotNotified should find active discounts that have not sent notifications', () => {
        const mockResults = [
            { _id: '1', name: 'New Discount', notification_sent: false }
        ];
        
        mockDiscount.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Discount.findNotNotified();
        
        expect(mockDiscount.find).toHaveBeenCalledWith({
            is_active: true,
            notification_sent: false
        });
    });

    // Test 34: markNotificationsSent should update notification status
    test('markNotificationsSent should update discount notification_sent to true', () => {
        const discountId = '123456789012345678901234';
        const updatedDiscount = {
            _id: discountId,
            notification_sent: true
        };
        
        mockDiscount.findByIdAndUpdate.mockResolvedValue(updatedDiscount);

        return Discount.markNotificationsSent(discountId).then(result => {
            expect(mockDiscount.findByIdAndUpdate).toHaveBeenCalledWith(
                discountId,
                { notification_sent: true },
                { new: true }
            );
        });
    });

    // Test 35: findActive should handle current date correctly
    test('findActive should use current date for date range comparison', () => {
        const beforeCall = new Date();
        
        Discount.findActive();
        
        const afterCall = new Date();
        const callArgs = mockDiscount.find.mock.calls[0][0];
        
        expect(callArgs.start_date.$lte.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
        expect(callArgs.start_date.$lte.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
        expect(callArgs.end_date.$gte.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
        expect(callArgs.end_date.$gte.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
    });
});

