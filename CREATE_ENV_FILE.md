# Create .env.local File

Since `.env.local` is protected, you need to create it manually. Follow these steps:

## Step 1: Create the file
1. In your project root folder (same folder as `package.json`), create a new file named `.env.local`
2. Copy and paste the following content into it:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tgefomtgtxytpecwlcwk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnZWZvbXRndHh5dHBlY3dsY3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTM0NTEsImV4cCI6MjA4MjE2OTQ1MX0.M8qB6DLnypoZvQ6x2z4wefA-fjpGuOx6XHjIvdOkPtQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnZWZvbXRndHh5dHBlY3dsY3drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzQ1MSwiZXhwIjoyMDgyMTY5NDUxfQ.pO3KNvicg-knt69943dYHA9kfURNA9qp8CjV06EQ17A
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Save the file

## Step 2: Verify
Make sure the file is in the root directory (same folder as `package.json`, `next.config.ts`, etc.)

The file structure should look like:
```
razmenime/
├── .env.local          ← Create this file here
├── package.json
├── next.config.ts
├── app/
├── components/
└── ...
```

## Done! ✅
Once you create this file, you can run `npm run dev` to start the application.

