const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Users = require('../db/models/Users');
const Review = require('../db/models/Review');
const Enum = require('../config/Enum');

/**
 * Ensures the default admin user exists in the database
 * Creates the admin user if it doesn't exist, or updates it if it exists
 * This runs automatically when the database connects (both local and deployment)
 */
const ensureAdminUser = async () => {
    try {
        const adminEmail = 'admin@gmail.com';
        const adminPassword = 'cs308';
        
        // Check if admin user already exists
        let adminUser = await Users.findByEmail(adminEmail);
        
        if (adminUser) {
            // Admin exists - ensure it has correct password and role
            const passwordMatches = await bcrypt.compare(adminPassword, adminUser.password);
            const needsUpdate = !passwordMatches || adminUser.role !== Enum.USER_ROLES.ADMIN || !adminUser.is_active;
            
            if (needsUpdate) {
                if (!passwordMatches) {
                    adminUser.password = await bcrypt.hash(adminPassword, 10);
                }
                adminUser.role = Enum.USER_ROLES.ADMIN;
                adminUser.is_active = true;
                adminUser.first_name = adminUser.first_name || 'Admin';
                adminUser.last_name = adminUser.last_name || 'User';
                await adminUser.save();
                console.log('✅ Admin user updated successfully');
            } else {
                console.log('✅ Admin user already exists and is configured correctly');
            }
        } else {
            // Admin doesn't exist - create it
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            
            adminUser = new Users({
                email: adminEmail,
                password: hashedPassword,
                first_name: 'Admin',
                last_name: 'User',
                role: Enum.USER_ROLES.ADMIN,
                is_active: true,
                language: Enum.LANG.en
            });
            
            await adminUser.save();
            console.log('✅ Default admin user created successfully');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
        }
        
        return adminUser;
    } catch (error) {
        console.error('❌ Error ensuring admin user:', error.message);
        throw error;
    }
};

/**
 * Removes the unique constraint from the reviews collection index
 * This allows users to submit multiple reviews/ratings for the same product
 */
const removeUniqueReviewIndex = async () => {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('reviews');
        
        // Get all indexes
        const indexes = await collection.indexes();
        
        // Find the unique index on product_id and customer_id
        const uniqueIndex = indexes.find(index => 
            index.name === 'product_id_1_customer_id_1' && index.unique === true
        );
        
        if (uniqueIndex) {
            console.log('🔄 Removing unique constraint from reviews index...');
            await collection.dropIndex('product_id_1_customer_id_1');
            console.log('✅ Unique constraint removed successfully');
            
            // Recreate the index without unique constraint (for performance)
            await collection.createIndex({ product_id: 1, customer_id: 1 });
            console.log('✅ Non-unique index recreated for performance');
        } else {
            console.log('✅ Reviews index is already non-unique');
        }
    } catch (error) {
        // If index doesn't exist or already dropped, that's fine
        if (error.code === 27 || error.codeName === 'IndexNotFound') {
            console.log('✅ Reviews unique index does not exist (already removed)');
        } else {
            console.error('⚠️  Warning: Could not remove unique index:', error.message);
            // Don't throw - allow server to continue
        }
    }
};

module.exports = {
    ensureAdminUser,
    removeUniqueReviewIndex
};

