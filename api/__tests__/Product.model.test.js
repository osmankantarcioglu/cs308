// Test Product model calculatePopularityScore method (doesn't require mongoose)
const Product = require('../db/models/Product');

describe('Product Model - calculatePopularityScore Method', () => {
    // Test 8: calculatePopularityScore should calculate score based on view_count
    test('calculatePopularityScore should calculate score based on view_count', () => {
        const product = {
            view_count: 100,
            createdAt: new Date()
        };
        
        const score = Product.calculatePopularityScore(product);
        
        expect(score).toBeGreaterThanOrEqual(0);
        expect(typeof score).toBe('number');
        // With 100 views: 100 * 0.1 = 10
        expect(score).toBeGreaterThanOrEqual(10);
    });

    // Test 9: calculatePopularityScore should add bonus for new products
    test('calculatePopularityScore should add bonus for products less than 30 days old', () => {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 15); // 15 days ago
        
        const product = {
            view_count: 50,
            createdAt: recentDate
        };
        
        const score = Product.calculatePopularityScore(product);
        
        // Should have at least the new product bonus (50) + view count calculation
        expect(score).toBeGreaterThanOrEqual(50);
    });

    // Test 10: calculatePopularityScore should handle products with zero views
    test('calculatePopularityScore should handle products with zero views', () => {
        const product = {
            view_count: 0,
            createdAt: new Date()
        };
        
        const score = Product.calculatePopularityScore(product);
        
        expect(score).toBeGreaterThanOrEqual(0);
        expect(typeof score).toBe('number');
    });
});
