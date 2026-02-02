# RazmeniMe - Donation and Exchange Platform

A Next.js application for donating and exchanging items in collaboration with the Red Cross of Serbia.

## Features

- **User Authentication**: Login and registration for users, organizations, and admins
- **Ad Management**: Create, edit, delete, and view donation ads
- **Real-time Chat**: Message system for communication between users
- **Map Integration**: View donation locations on an interactive map
- **Category Filtering**: Browse donations by category
- **Admin Panel**: User management and content moderation
- **Donation Requests**: Organizations and families can request specific items

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL with PostGIS)
- **Authentication**: Supabase Auth
- **Maps**: Leaflet.js
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Language**: TypeScript

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Set up Supabase:
   - Run migrations in `supabase/migrations/001_initial_schema.sql`
   - Run RLS policies in `supabase/migrations/002_rls_policies.sql`
   - Seed categories with `supabase/seed.sql`

4. Create Storage buckets in Supabase:
   - `ad-images` (public)
   - `avatars` (authenticated)
   - `organization-logos` (public)

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
app/
├── (auth)/          # Authentication pages
├── (main)/          # Main application pages
├── layout.tsx       # Root layout with navbar
└── page.tsx         # Homepage

components/
├── ads/             # Ad-related components
├── chat/            # Chat components
├── layout/          # Layout components (Navbar, etc.)
├── map/             # Map components
└── ui/              # Reusable UI components

lib/
├── supabase/        # Supabase client configuration
└── utils/           # Utility functions

supabase/
├── migrations/      # Database migrations
└── seed.sql         # Seed data
```

## Database Schema

The application uses the following main tables:
- `profiles` - User profiles linked to Supabase Auth
- `organizations` - Humanitarian organizations
- `families` - Families in need
- `ads` - Donation advertisements
- `donation_requests` - Requests from organizations/families
- `conversations` & `messages` - Chat system
- `categories` - Ad categories
- `locations` - Geographic locations with PostGIS support

## Features in Detail

### Authentication
- Role-based access (user, organization, admin)
- Secure password hashing via Supabase Auth
- Profile creation on signup

### Ads
- Full CRUD operations
- Image upload support
- Category and location filtering
- Condition tracking (excellent, good, solid)

### Chat
- Real-time messaging with Supabase Realtime
- Conversation management
- Unread message indicators

### Map
- Interactive map showing donation locations
- City markers with item counts
- Distance-based filtering

## License

Private project for RazmeniMe/Red Cross Serbia
