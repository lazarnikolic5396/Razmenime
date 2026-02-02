# Quick Start Checklist

Follow these steps in order:

## ✅ Step 1: Install Node.js (if not installed)
- Download from: https://nodejs.org/ (choose LTS version)
- Install it
- **Restart your terminal/command prompt**
- Verify: Open new terminal and type `node --version` (should show v18.x or higher)

## ✅ Step 2: Install Project Dependencies
Open terminal in project folder and run:
```bash
npm install
```

## ✅ Step 3: Create Supabase Account & Project
1. Go to: https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - Name: `razmenime`
   - Database Password: (create a strong password - SAVE IT!)
   - Region: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes

## ✅ Step 4: Get Your Supabase Keys
1. In Supabase dashboard, click **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (long string - keep this secret!)

## ✅ Step 5: Create .env.local File
1. In your project root folder, create a new file named `.env.local`
2. Copy this template and paste your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=paste_your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ✅ Step 6: Create Database Tables (IMPORTANT!)

### Option A: In Supabase Dashboard (manual)

1. Click **SQL Editor** (in left sidebar)
2. Click **New Query**
3. Open file: `supabase/migrations/001_initial_schema.sql` from this project
4. **Copy ALL the text** from that file
5. **Paste into SQL Editor**
6. Click **Run** (or press Ctrl+Enter)
7. Wait for "Success" message

4. Now open: `supabase/migrations/002_rls_policies.sql`
5. Copy ALL text, paste into SQL Editor, click **Run**

6. Now open: `supabase/seed.sql`
7. Copy ALL text, paste into SQL Editor, click **Run**

### Option B: Automated (PowerShell + psql)

1. Install PostgreSQL client tools (to get `psql`) and ensure it's on PATH
2. In Supabase dashboard, go to **Settings** → **Database** → **Connection string**
3. Set `SUPABASE_DB_URL` in your terminal:
```powershell
$env:SUPABASE_DB_URL="your-connection-string"
```
4. Run:
```powershell
npm run db:setup
```

### Verify Tables Were Created:
1. Click **Table Editor** (in left sidebar)
2. You should see 12 tables:
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

## ✅ Step 7: Enable PostGIS Extension
1. Click **Database** → **Extensions**
2. Search for "postgis"
3. Click **Enable**

## ✅ Step 8: Set Up Storage Buckets
1. Click **Storage** (in left sidebar)
2. Click **Create a new bucket**

   **Create 3 buckets:**

   **Bucket 1:**
   - Name: `ad-images`
   - Public: ✅ (check this box)
   - Create

   **Bucket 2:**
   - Name: `avatars`
   - Public: ❌ (leave unchecked)
   - Create

   **Bucket 3:**
   - Name: `organization-logos`
   - Public: ✅ (check this box)
   - Create

## ✅ Step 9: Enable Realtime
1. Click **Database** → **Replication**
2. Find `messages` table → Toggle ON
3. Find `conversations` table → Toggle ON

## ✅ Step 10: Start the App!
In your terminal, run:
```bash
npm run dev
```

Then open: http://localhost:3000

---

## 🐛 Troubleshooting

**"npm is not recognized"**
→ Install Node.js and restart terminal

**"No tables in Supabase"**
→ Make sure you ran all 3 SQL files in SQL Editor

**"Connection error"**
→ Check your `.env.local` file has correct values

**"PostGIS error"**
→ Enable the extension in Database → Extensions

