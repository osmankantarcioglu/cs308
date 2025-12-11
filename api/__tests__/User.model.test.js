// Load User model
const Users = require('../db/models/Users');

describe('User Model Static Methods', () => {
    let mockUser;
    
    beforeEach(() => {
        mockUser = {
            findOne: jest.fn(),
        };
        
        Users.findOne = mockUser.findOne;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test 17: findByEmail should find user by email (lowercase)
    test('findByEmail should find user by email in lowercase', () => {
        const email = 'Test@Example.COM';
        const mockUserResult = { _id: '123', email: 'test@example.com' };
        
        mockUser.findOne.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUserResult)
        });

        Users.findByEmail(email);
        
        expect(mockUser.findOne).toHaveBeenCalledWith({
            email: email.toLowerCase()
        });
    });

    // Test 18: findByTaxID should find user by taxID
    test('findByTaxID should find user by taxID', () => {
        const taxID = '1234567890';
        const mockUserResult = { _id: '123', taxID: taxID };
        
        mockUser.findOne.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUserResult)
        });

        Users.findByTaxID(taxID);
        
        expect(mockUser.findOne).toHaveBeenCalledWith({
            taxID: taxID
        });
    });
});

