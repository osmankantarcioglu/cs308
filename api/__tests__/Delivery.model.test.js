// Load Delivery model
const Delivery = require('../db/models/Delivery');
const Enum = require('../config/Enum');

describe('Delivery Model Static Methods', () => {
    let mockDelivery;
    
    beforeEach(() => {
        mockDelivery = {
            find: jest.fn().mockReturnThis(),
            findByIdAndUpdate: jest.fn(),
        };
        
        Delivery.find = mockDelivery.find;
        Delivery.findByIdAndUpdate = mockDelivery.findByIdAndUpdate;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test 44: findPending should find deliveries with pending status
    test('findPending should find deliveries with pending status', () => {
        const mockResults = [
            { _id: '1', status: Enum.DELIVERY_STATUS.PENDING }
        ];
        
        mockDelivery.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Delivery.findPending();
        
        expect(mockDelivery.find).toHaveBeenCalledWith({
            status: Enum.DELIVERY_STATUS.PENDING
        });
    });

    // Test 45: findByOrder should find deliveries for specific order
    test('findByOrder should find all deliveries for an order', () => {
        const orderId = '123456789012345678901234';
        const mockResults = [
            { _id: '1', order_id: orderId, status: Enum.DELIVERY_STATUS.PENDING }
        ];
        
        mockDelivery.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Delivery.findByOrder(orderId);
        
        expect(mockDelivery.find).toHaveBeenCalledWith({ order_id: orderId });
    });

    // Test 46: updateDeliveryStatus should update status and set delivery_date if delivered
    test('updateDeliveryStatus should update status and set delivery_date when status is delivered', () => {
        const deliveryId = '123456789012345678901234';
        const status = Enum.DELIVERY_STATUS.DELIVERED;
        const trackingNumber = 'TRACK123';
        const updatedDelivery = {
            _id: deliveryId,
            status: status,
            delivery_date: expect.any(Date),
            tracking_number: trackingNumber
        };
        
        mockDelivery.findByIdAndUpdate.mockResolvedValue(updatedDelivery);

        return Delivery.updateDeliveryStatus(deliveryId, status, trackingNumber).then(result => {
            expect(mockDelivery.findByIdAndUpdate).toHaveBeenCalledWith(
                deliveryId,
                expect.objectContaining({
                    status: status,
                    delivery_date: expect.any(Date),
                    tracking_number: trackingNumber
                }),
                { new: true }
            );
        });
    });
});

