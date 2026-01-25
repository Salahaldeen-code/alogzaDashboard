// Simple script to test database connection
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection successful!', result);
    
    // Try to list tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📊 Existing tables:', tables);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Database server is not running or paused');
    console.error('2. Network/firewall blocking port 5432');
    console.error('3. Incorrect password or credentials');
    console.error('4. IP address not whitelisted in Supabase');
    console.error('5. Database URL format is incorrect');
    console.error('\nTroubleshooting steps:');
    console.error('- Check Supabase dashboard to ensure database is active');
    console.error('- Verify your IP is allowed in Supabase settings');
    console.error('- Try using Supabase connection pooler (port 6543)');
    console.error('- Check if your network allows outbound connections on port 5432');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

