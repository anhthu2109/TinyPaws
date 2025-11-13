const User = require('../models/User');

const createDefaultAdmin = async () => {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
        
        if (existingAdmin) {
            console.log('👤 Admin user already exists');
            return;
        }

        // Create default admin user
        const adminData = {
            full_name: 'Administrator',
            email: 'admin@gmail.com',
            hashed_password: '123456',
            role: 'admin'
        };

        const admin = await User.createAdmin(adminData);
        console.log('✅ Default admin user created successfully');
        console.log('📧 Email: admin@gmail.com');
        console.log('🔑 Password: 123456');
        
    } catch (error) {
        console.error('❌ Error creating default admin:', error);
    }
};

// Execute the function
createDefaultAdmin();

module.exports = createDefaultAdmin;
