// Load Cart model
const Cart = require('../db/models/Cart');

describe('Cart Model Static Methods', () => {
    let mockCart;
    
    beforeEach(() => {
        mockCart = {
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
        };
        
        Cart.findOne = mockCart.findOne;
        Cart.findOneAndUpdate = mockCart.findOneAndUpdate;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test 20: findByUser should find cart by user ID
    test('findByUser should find active cart by user ID', () => {
        const userId = '123456789012345678901234';
        const mockCartResult = { _id: '1', user_id: userId, items: [] };
        
        mockCart.findOne.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockCartResult)
        });

        Cart.findByUser(userId);
        
        expect(mockCart.findOne).toHaveBeenCalledWith({
            user_id: userId,
            is_active: true
        });
    });

    // Test 21: findBySession should find cart by session ID
    test('findBySession should find active cart by session ID', () => {
        const sessionId = 'session123';
        const mockCartResult = { _id: '1', session_id: sessionId, items: [] };
        
        mockCart.findOne.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockCartResult)
        });

        Cart.findBySession(sessionId);
        
        expect(mockCart.findOne).toHaveBeenCalledWith({
            session_id: sessionId,
            is_active: true
        });
    });

    // Test 22: clearCart should deactivate cart
    test('clearCart should set cart is_active to false', () => {
        const sessionId = 'session123';
        const userId = '123456789012345678901234';
        const updatedCart = { _id: '1', is_active: false };
        
        mockCart.findOneAndUpdate.mockResolvedValue(updatedCart);

        return Cart.clearCart(sessionId, userId).then(result => {
            expect(mockCart.findOneAndUpdate).toHaveBeenCalledWith(
                { user_id: userId, is_active: true },
                { is_active: false },
                { new: true }
            );
        });
    });
});
