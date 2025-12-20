// Load Category model
const Category = require('../db/models/Category');

describe('Category Model Static Methods', () => {
    let mockCategory;
    
    beforeEach(() => {
        mockCategory = {
            find: jest.fn().mockReturnThis(),
            findOne: jest.fn(),
        };
        
        Category.find = mockCategory.find;
        Category.findOne = mockCategory.findOne;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test 36: findActive should find only active categories
    test('findActive should find categories with is_active true', () => {
        const mockResults = [
            { _id: '1', name: 'Electronics', is_active: true },
            { _id: '2', name: 'Clothing', is_active: true }
        ];
        
        mockCategory.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResults)
        });

        Category.findActive();
        
        expect(mockCategory.find).toHaveBeenCalledWith({ is_active: true });
    });

    // Test 37: findByName should find active category by name
    test('findByName should find active category by name', () => {
        const categoryName = 'Electronics';
        const mockResult = { _id: '1', name: categoryName, is_active: true };
        
        mockCategory.findOne.mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockResult)
        });

        Category.findByName(categoryName);
        
        expect(mockCategory.findOne).toHaveBeenCalledWith({
            name: categoryName,
            is_active: true
        });
    });
});

