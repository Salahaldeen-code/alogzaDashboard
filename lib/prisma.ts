import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error(
    '\n❌ DATABASE_URL is not set!\n' +
    'Please create a .env.local file in the project root with:\n' +
    'DATABASE_URL="postgresql://user:password@localhost:5432/dbname"\n' +
    '\nFor Supabase, use the connection string from your project settings.\n' +
    'For local PostgreSQL, use: postgresql://postgres:password@localhost:5432/alogza_dashboard\n'
  )
}

// Validate DATABASE_URL format
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.warn(
    '⚠️  DATABASE_URL should start with "postgresql://"\n' +
    'Current value starts with: ' + process.env.DATABASE_URL.substring(0, 20) + '...'
  )
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

