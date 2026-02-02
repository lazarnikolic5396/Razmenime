# Fix for Dependency Conflict

## Issue
`react-leaflet@4.2.1` has a peer dependency requirement for React ^18.0.0, but the project uses React 19.2.3. React-leaflet works fine with React 19, but npm's strict peer dependency checking is preventing installation.

## Solution

Run npm install with the `--legacy-peer-deps` flag:

```powershell
npm install --legacy-peer-deps
```

This tells npm to use the legacy (npm 6) peer dependency resolution algorithm, which is more lenient and will allow the installation to proceed.

## Why This Works

- React 19 is backward compatible with React 18 code
- react-leaflet will work perfectly fine with React 19
- The peer dependency warning is overly conservative
- This is a common and safe solution for React 19 projects

## Alternative (if above doesn't work)

If you still encounter issues, you can also try:

```powershell
npm install --force
```

But `--legacy-peer-deps` is the recommended approach.

## After Installation

Once `npm install` completes successfully:

1. Create the `.env.local` file (see `CREATE_ENV_FILE.md`)
2. Set up storage buckets in Supabase (see `NEXT_STEPS.md`)
3. Run `npm run dev` to start the application

