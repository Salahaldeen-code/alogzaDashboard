# Database Connection Troubleshooting

## Current Issue

Prisma cannot connect to your Supabase database at `db.hqnogrhzwrkqpkwqiuru.supabase.co:5432`.

## Common Causes & Solutions

### 1. Database is Paused (Most Common)

Supabase free tier databases pause after inactivity.

**Solution:**
- Go to your Supabase dashboard: https://supabase.com/dashboard
- Navigate to your project
- Check if the database shows as "Paused"
- Click "Restore" or "Resume" to wake it up
- Wait a few minutes for it to fully start

### 2. IP Address Not Whitelisted

Supabase may require your IP to be whitelisted.

**Solution:**
- Go to Supabase Dashboard → Settings → Database
- Check "Connection Pooling" or "Network Restrictions"
- Add your current IP address to the allowed list
- Or disable IP restrictions temporarily for testing

### 3. Network/Firewall Issues

Your network or firewall might be blocking port 5432.

**Solution:**
- Try using Supabase's connection pooler on port 6543:
  ```
  DATABASE_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true"
  ```
- Check if your corporate network/firewall allows outbound connections
- Try from a different network (mobile hotspot, etc.)

### 4. Incorrect Connection String

The password or connection string format might be wrong.

**Solution:**
- Get the connection string from Supabase Dashboard → Settings → Database
- Use the "Connection string" → "URI" option
- Make sure the password is correct (check for typos)
- If password contains special characters, try URL encoding them

### 5. Test the Connection

Run the test script to get more details:

```bash
node test-connection.js
```

## Alternative: Use Connection Pooler

Supabase's connection pooler (port 6543) is often more reliable:

Update your `.env.local`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.hqnogrhzwrkqpkwqiuru.supabase.co:6543/postgres?pgbouncer=true"
```

**Note:** When using the pooler, you cannot run migrations directly. Use Supabase's SQL editor or the direct connection for schema changes.

## Quick Test

1. **Check Supabase Dashboard:**
   - Is the database active/running?
   - Are there any error messages?

2. **Test with psql (if installed):**
   ```bash
   psql "postgresql://postgres:YOUR_PASSWORD@db.hqnogrhzwrkqpkwqiuru.supabase.co:5432/postgres"
   ```

3. **Check Network:**
   ```bash
   telnet db.hqnogrhzwrkqpkwqiuru.supabase.co 5432
   ```
   (Should connect if network allows it)

## Still Not Working?

If none of these work, consider:
1. Using a local PostgreSQL database for development
2. Contacting Supabase support
3. Checking Supabase status page for outages

