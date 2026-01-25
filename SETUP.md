# Database Setup Guide

## Current Issue

Your application is trying to connect to a Supabase database but cannot reach it. You need to configure your database connection.

## Option 1: Use Supabase (Cloud Database)

If you want to use Supabase:

1. **Get your Supabase connection string:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → Database
   - Find the "Connection string" section
   - Copy the "URI" connection string (it should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

2. **Create `.env.local` file** in the project root:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
   ```
   Replace `YOUR_PASSWORD` with your actual database password.

3. **Test the connection:**
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

## Option 2: Use Local PostgreSQL (Recommended for Development)

If you want to use a local PostgreSQL database:

1. **Install PostgreSQL:**
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=alogza_dashboard -p 5432:5432 -d postgres`

2. **Create `.env.local` file** in the project root:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alogza_dashboard"
   ```
   Adjust username, password, and database name as needed.

3. **Set up the database:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Push the schema to create tables
   npm run prisma:push
   
   # (Optional) Run migrations if you have them
   npm run prisma:migrate
   ```

4. **Seed the database (optional):**
   If you have seed scripts in the `scripts/` folder, you can run them to populate initial data.

## Option 3: Use Other PostgreSQL Hosting

You can use any PostgreSQL database provider (AWS RDS, Railway, Neon, etc.):

1. Get your connection string from your provider
2. Add it to `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

## Troubleshooting

### "Can't reach database server"
- Check if your database server is running
- Verify the connection string is correct
- Check firewall/network settings
- For Supabase: Ensure your IP is allowed (check Supabase dashboard)

### "Authentication failed"
- Verify username and password are correct
- Check if the user has proper permissions

### "Database does not exist"
- Create the database first: `CREATE DATABASE alogza_dashboard;`
- Or use an existing database name in your connection string

## After Setup

Once your database is configured:

1. Restart your dev server: `npm run dev`
2. The application should now connect successfully
3. You can manage data through:
   - The Admin Panel at `/admin`
   - Prisma Studio: `npm run prisma:studio`

