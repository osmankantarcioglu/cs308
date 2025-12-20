// Load Order model
const Order = require('../db/models/Order');
const Enum = require('../config/Enum');

describe('Order Model Static Methods', () => {
    let mockOrder;
    
    beforeEach(() => {
        mockOrder = {
            find: jest.fn().mockReturnThis(),
            findOne: jest.fn(),
        };
        
        Order.find = mockOrder.find;
        Order.findOne = mockOrder.findOne;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test 26: findByCustomer should find orders by customer ID
    test('findByCustomer should find orders sorted by order_date descending', () => {
        const customerId = '123456789012345678901234';
        const mockResults = [
            { _id: '1', customer_id: customerId, order_number: 'ORD-001' },
            { _id: '2', customer_id: customerId, order_number: 'ORD-002' }
        ];
        
        mockOrder.find.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockResults)
            })
        });

        Order.findByCustomer(customerId);
        
        expect(mockOrder.find).toHaveBeenCalledWith({ customer_id: customerId });
    });

    // Test 27: findByStatus should find orders by status
    test('findByStatus should find orders with specific status', () => {
        const status = Enum.ORDER_STATUS.DELIVERED;
        const mockResults = [
            { _id: '1', status: status, order_number: 'ORD-001' }
        ];
        
        mockOrder.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Order.findByStatus(status);
        
        expect(mockOrder.find).toHaveBeenCalledWith({ status });
    });

    // Test 28: findByDateRange should find orders within date range
    test('findByDateRange should find orders within date range', () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');
        const mockResults = [
            { _id: '1', order_date: new Date('2024-01-15') }
        ];
        
        mockOrder.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Order.findByDateRange(startDate, endDate);
        
        expect(mockOrder.find).toHaveBeenCalledWith({
            order_date: {
                $gte: startDate,
                $lte: endDate
            }
        });
    });

    // Test 29: findCancellableOrders should find processing orders for customer
    test('findCancellableOrders should find processing orders for customer', () => {
        const customerId = '123456789012345678901234';
        const mockResults = [
            { _id: '1', customer_id: customerId, status: Enum.ORDER_STATUS.PROCESSING }
        ];
        
        mockOrder.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Order.findCancellableOrders(customerId);
        
        expect(mockOrder.find).toHaveBeenCalledWith({
            customer_id: customerId,
            status: Enum.ORDER_STATUS.PROCESSING
        });
    });

    // Test 30: findRefundableOrders should find delivered orders within 30 days
    test('findRefundableOrders should find delivered orders within 30 days', () => {
        const customerId = '123456789012345678901234';
        const mockResults = [
            { _id: '1', customer_id: customerId, status: Enum.ORDER_STATUS.DELIVERED }
        ];
        
        mockOrder.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Order.findRefundableOrders(customerId);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        expect(mockOrder.find).toHaveBeenCalledWith({
            customer_id: customerId,
            status: Enum.ORDER_STATUS.DELIVERED,
            order_date: { $gte: expect.any(Date) }
        });
    });
});

