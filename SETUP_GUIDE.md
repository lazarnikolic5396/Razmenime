# RazmeniMe Setup Guide

## Prerequisites

1. **Node.js and npm**: If you don't have Node.js installed:
   - Download from: https://nodejs.org/ (LTS version recommended)
   - Verify installation: Open a new terminal and run `node --version` and `npm --version`

2. **Supabase Account**: Create a free account at https://supabase.com

## Step 1: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including:
- @supabase/supabase-js
- @supabase/ssr
- leaflet
- react-leaflet
- react-hook-form
- zod
- date-fns
- And other dependencies

## Step 2: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: razmenime (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
   - Click "Create new project"
4. Wait 2-3 minutes for the project to be created

## Step 3: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll see:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## Step 4: Configure Environment Variables

1. Create a file named `.env.local` in the root directory (same level as `package.json`)
2. Add the following content (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Never commit `.env.local` to git (it's already in `.gitignore`)

## Step 5: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy ALL the contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for it to complete (should see "Success. No rows returned")
8. Now open `supabase/migrations/002_rls_policies.sql`
9. Copy ALL contents and paste into SQL Editor
10. Click **Run** again
11. Now open `supabase/seed.sql`
12. Copy contents and paste into SQL Editor
13. Click **Run** again

### Option B: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 6: Verify Tables Were Created

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - profiles
   - organizations
   - families
   - categories
   - locations
   - ads
   - donation_requests
   - donations
   - conversations
   - messages
   - activity_logs
   - reported_content

3. Check the **categories** table - it should have 9 rows (Sve Kategorije, Odeća, Nameštaj, etc.)

## Step 7: Set Up Storage Buckets

1. In Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Create these three buckets:

   **Bucket 1: ad-images**
   - Name: `ad-images`
   - Public bucket: ✅ (checked)
   - File size limit: 10 MB
   - Allowed MIME types: `image/*`
   - Click **Create bucket**

   **Bucket 2: avatars**
   - Name: `avatars`
   - Public bucket: ❌ (unchecked - private)
   - File size limit: 5 MB
   - Allowed MIME types: `image/*`
   - Click **Create bucket**

   **Bucket 3: organization-logos**
   - Name: `organization-logos`
   - Public bucket: ✅ (checked)
   - File size limit: 5 MB
   - Allowed MIME types: `image/*`
   - Click **Create bucket**

4. For each bucket, set up policies:
   - Click on the bucket name
   - Go to **Policies** tab
   - Click **New Policy**
   - For `ad-images` and `organization-logos` (public):
     - Policy name: "Public Access"
     - Allowed operation: SELECT
     - Target roles: anon, authenticated
     - Policy definition: `true`
   - For `avatars` (private):
     - Policy name: "Authenticated users can upload"
     - Allowed operation: INSERT
     - Target roles: authenticated
     - Policy definition: `auth.uid() = user_id`
     - Policy name: "Users can view own avatar"
     - Allowed operation: SELECT
     - Target roles: authenticated
     - Policy definition: `auth.uid() = user_id`

## Step 8: Enable PostGIS Extension

1. Go to **Database** → **Extensions** in Supabase dashboard
2. Search for "postgis"
3. Click **Enable** next to "postgis"
4. Wait for it to activate

## Step 9: Enable Realtime for Messages

1. Go to **Database** → **Replication** in Supabase dashboard
2. Find the `messages` table
3. Toggle it ON to enable replication
4. Do the same for `conversations` table

## Step 10: Start the Development Server

1. Make sure you're in the project directory
2. Run:

```bash
npm run dev
```

3. Open your browser to http://localhost:3000
4. You should see the RazmeniMe homepage!

## Troubleshooting

### "npm is not recognized"
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation
- Verify with `node --version` and `npm --version`

### "Tables not showing in Supabase"
- Make sure you ran ALL three SQL files in order:
  1. `001_initial_schema.sql`
  2. `002_rls_policies.sql`
  3. `seed.sql`
- Check the SQL Editor for any error messages
- Refresh the Table Editor page

### "Cannot connect to Supabase"
- Verify your `.env.local` file has correct credentials
- Check that your Supabase project is active (not paused)
- Make sure the URL and keys are correct (no extra spaces)

### "PostGIS extension not found"
- Some Supabase projects may need to enable it manually
- Go to Database → Extensions → Enable postgis

### "Realtime not working"
- Make sure you enabled replication for `messages` and `conversations` tables
- Check that your Supabase plan supports Realtime (free tier does)

## Next Steps After Setup

1. **Test Registration**: Go to `/register` and create a test account
2. **Test Login**: Log in with your test account
3. **Create an Ad**: Click "DONIRAJ STVARI" and create a test donation
4. **Test Chat**: Request an item to start a conversation
5. **Test Map**: Go to "Mapa Donacija" to see locations

## Need Help?

- Check Supabase documentation: https://supabase.com/docs
- Check Next.js documentation: https://nextjs.org/docs
- Review the code comments in the project files

