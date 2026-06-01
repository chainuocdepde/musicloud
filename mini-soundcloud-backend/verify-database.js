require('dotenv').config();
const supabase = require('./src/config/supabase');

async function verifyDatabase() {
    console.log('🔍 Checking database schema...\n');

    try {
        // Check if users table exists and get a sample record structure
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error accessing users table:', error.message);
            return;
        }

        console.log('✅ Users table is accessible\n');

        // Check for required columns
        const requiredColumns = [
            'user_id',
            'username',
            'email',
            'password_hash',
            'auth_method',
            'role',
            'avatar_url',
            'preferences',
            'created_at',
            'reset_token',        // NEW - for password reset
            'reset_token_expiry'  // NEW - for password reset
        ];

        if (users && users.length > 0) {
            const sampleUser = users[0];
            const existingColumns = Object.keys(sampleUser);

            console.log('📋 Existing columns in users table:');
            existingColumns.forEach(col => {
                console.log(`   ✓ ${col}`);
            });

            console.log('\n🔎 Checking for required columns:\n');

            const missingColumns = [];
            requiredColumns.forEach(col => {
                if (existingColumns.includes(col)) {
                    console.log(`   ✅ ${col} - EXISTS`);
                } else {
                    console.log(`   ❌ ${col} - MISSING`);
                    missingColumns.push(col);
                }
            });

            if (missingColumns.length > 0) {
                console.log('\n⚠️  MIGRATION REQUIRED!\n');
                console.log('Missing columns:', missingColumns.join(', '));
                console.log('\nRun the SQL migration in Supabase SQL Editor:');
                console.log('File: database_migration.sql\n');
            } else {
                console.log('\n✅ All required columns exist! Database is ready.\n');
            }
        } else {
            console.log('⚠️  No users in database yet. Cannot verify schema.');
            console.log('Please run the migration SQL first:\n');
            console.log('File: database_migration.sql\n');
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

verifyDatabase();
