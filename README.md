This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Alogza 2026 Plan Dashboard

A comprehensive business intelligence dashboard for tracking revenue targets, clients, projects, KPIs, and risks.

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env.local` file in the root directory with the following:

```env
# Database Configuration (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/alogza_dashboard?schema=public"

# Optional: Supabase Configuration (if you plan to use Supabase in the future)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

3. **Set up the database:**
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (if you have migrations)
npm run prisma:migrate

# Or push the schema directly
npm run prisma:push
```

4. **Seed the database (optional):**
If you have seed scripts, you can run them to populate initial data.

5. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and database clients
- `/prisma` - Prisma schema and migrations

## Database

This project uses Prisma ORM with PostgreSQL. The database schema includes:
- Revenue Targets
- Clients
- Projects
- KPIs
- Risks

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
