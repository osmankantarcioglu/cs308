const bcrypt = require('bcryptjs');
const Users = require('../db/models/Users');
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

module.exports = {
    ensureAdminUser
};

