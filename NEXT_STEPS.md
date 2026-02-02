# ✅ Setup Complete - Next Steps

## ✅ What's Already Done

1. ✅ **Database Tables Created**: All 12 tables are now in your Supabase database
2. ✅ **RLS Policies Applied**: Security policies are active
3. ✅ **Categories Seeded**: 9 categories are ready to use

## 📋 What You Need to Do Now

### 1. Create .env.local File
See `CREATE_ENV_FILE.md` for instructions on creating the environment file with your Supabase credentials.

### 2. Install Dependencies
Open a terminal in the project folder and run:
```bash
npm install
```

**Note**: If you get "npm is not recognized", you need to install Node.js first from https://nodejs.org/

### 3. Set Up Storage Buckets in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/tgefomtgtxytpecwlcwk
2. Click **Storage** in the left sidebar
3. Create these 3 buckets:

   **Bucket 1: `ad-images`**
   - Name: `ad-images`
   - Public bucket: ✅ (checked)
   - File size limit: 10 MB
   - Allowed MIME types: `image/*`
   
   **Bucket 2: `avatars`**
   - Name: `avatars`
   - Public bucket: ❌ (unchecked)
   - File size limit: 5 MB
   - Allowed MIME types: `image/*`
   
   **Bucket 3: `organization-logos`**
   - Name: `organization-logos`
   - Public bucket: ✅ (checked)
   - File size limit: 5 MB
   - Allowed MIME types: `image/*`

### 4. Enable Realtime (for Chat Feature)

1. In Supabase dashboard, go to **Database** → **Replication**
2. Find `messages` table → Toggle ON
3. Find `conversations` table → Toggle ON

### 5. Verify PostGIS is Enabled

1. Go to **Database** → **Extensions**
2. Check if `postgis` is enabled (should be automatic, but verify)
3. If not, click **Enable**

### 6. Start the Application

Once `.env.local` is created and dependencies are installed:

```bash
npm run dev
```

Then open: http://localhost:3000

## 🎉 You're Ready!

The application should now be fully functional. You can:
- Register a new account
- Log in
- Create donation ads
- Browse categories
- View the map
- Chat with other users

## 🔍 Verify Everything Works

1. Go to http://localhost:3000
2. Click "Registruj se" (Register) to create an account
3. Log in with your account
4. Click "DONIRAJ STVARI" to create a test donation
5. Browse categories and map

## 🐛 Troubleshooting

**"Cannot connect to Supabase"**
- Make sure `.env.local` file exists and has correct values
- No extra spaces in the values
- File must be named exactly `.env.local`

**"npm is not recognized"**
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

**"Storage upload fails"**
- Make sure you created all 3 storage buckets
- Check bucket permissions

