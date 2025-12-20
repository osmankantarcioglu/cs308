// Load Refund model
const Refund = require('../db/models/Refund');
const Enum = require('../config/Enum');

describe('Refund Model Static Methods', () => {
    let mockRefund;
    
    beforeEach(() => {
        mockRefund = {
            find: jest.fn().mockReturnThis(),
            findOne: jest.fn(),
            findByIdAndUpdate: jest.fn(),
        };
        
        Refund.find = mockRefund.find;
        Refund.findOne = mockRefund.findOne;
        Refund.findByIdAndUpdate = mockRefund.findByIdAndUpdate;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test 39: findByCustomer should find refunds sorted by request_date
    test('findByCustomer should find refunds for customer sorted by request_date descending', () => {
        const customerId = '123456789012345678901234';
        const mockResults = [
            { _id: '1', customer_id: customerId, refund_number: 'REF-001' }
        ];
        
        mockRefund.find.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockResults)
            })
        });

        Refund.findByCustomer(customerId);
        
        expect(mockRefund.find).toHaveBeenCalledWith({ customer_id: customerId });
    });

    // Test 40: findPending should find refunds with pending status
    test('findPending should find refunds with pending status', () => {
        const mockResults = [
            { _id: '1', status: Enum.REFUND_STATUS.PENDING, refund_number: 'REF-001' }
        ];
        
        mockRefund.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Refund.findPending();
        
        expect(mockRefund.find).toHaveBeenCalledWith({
            status: Enum.REFUND_STATUS.PENDING
        });
    });

    // Test 41: findByOrder should find refunds for specific order
    test('findByOrder should find all refunds for an order', () => {
        const orderId = '123456789012345678901234';
        const mockResults = [
            { _id: '1', order_id: orderId, refund_number: 'REF-001' }
        ];
        
        mockRefund.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Refund.findByOrder(orderId);
        
        expect(mockRefund.find).toHaveBeenCalledWith({ order_id: orderId });
    });

    // Test 42: approveRefund should update refund to approved status
    test('approveRefund should update refund status to approved', () => {
        const refundId = '123456789012345678901234';
        const approvedBy = '987654321098765432109876';
        const updatedRefund = {
            _id: refundId,
            status: Enum.REFUND_STATUS.APPROVED,
            approved_by: approvedBy,
            approval_date: expect.any(Date)
        };
        
        mockRefund.findByIdAndUpdate.mockResolvedValue(updatedRefund);

        return Refund.approveRefund(refundId, approvedBy).then(result => {
            expect(mockRefund.findByIdAndUpdate).toHaveBeenCalledWith(
                refundId,
                expect.objectContaining({
                    status: Enum.REFUND_STATUS.APPROVED,
                    approved_by: approvedBy,
                    approval_date: expect.any(Date)
                }),
                { new: true }
            );
        });
    });

    // Test 43: rejectRefund should update refund to rejected status with reason
    test('rejectRefund should update refund status to rejected with reason', () => {
        const refundId = '123456789012345678901234';
        const approvedBy = '987654321098765432109876';
        const reason = 'Product not returned';
        const updatedRefund = {
            _id: refundId,
            status: Enum.REFUND_STATUS.REJECTED,
            approved_by: approvedBy,
            rejection_reason: reason
        };
        
        mockRefund.findByIdAndUpdate.mockResolvedValue(updatedRefund);

        return Refund.rejectRefund(refundId, approvedBy, reason).then(result => {
            expect(mockRefund.findByIdAndUpdate).toHaveBeenCalledWith(
                refundId,
                expect.objectContaining({
                    status: Enum.REFUND_STATUS.REJECTED,
                    approved_by: approvedBy,
                    rejection_reason: reason,
                    approval_date: expect.any(Date)
                }),
                { new: true }
            );
        });
    });
});

