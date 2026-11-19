# BlendHub

A café management application being developed toward a QR ordering system. BlendHub currently provides account authentication, café setup, and menu management.

## Features

- **Authentication:** email and password registration, sign-in, Google sign-in and account linking, sign-out, and password reset emails.
- **Café dashboard:** create cafés and view the cafés associated with your account.
- **Menu management:** café owners can add, edit, and delete items with names, categories, and prices, and change their availability.
- **Menu photos:** upload JPG, PNG, or WebP images up to 2 MB through Cloudinary.
- **Access control:** café membership controls access, with owner-only menu changes enforced on the server.

QR code generation, customer ordering, and order management are not implemented yet.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router, React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL with `pg` |
| Authentication | Better Auth |
| Image storage | Cloudinary |
| Email | Nodemailer with Gmail |

## Local setup

### 1. Install dependencies

You will need Node.js 20.9 or later, npm, and a PostgreSQL database. Google OAuth credentials, a Gmail account with an app password, and Cloudinary credentials enable their respective features.

```bash
git clone https://github.com/prabishrestha581-dev/blendhub-fyp.git
cd blendhub-fyp
npm ci
```

### 2. Configure environment variables

Create `.env.local` in the project root with your own values:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/blendhub

BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Generate a random authentication secret, for example with `openssl rand -base64 32`. Environment files are ignored by Git; keep real credentials out of the README and repository.

For local Google sign-in, configure this authorized redirect URI in your Google OAuth application:

```text
http://localhost:3000/api/auth/callback/google
```

### 3. Initialize the database

Create the PostgreSQL database referenced by `DATABASE_URL`. Initialize the Better Auth schema for the configuration in `lib/auth.ts` before running the café migrations: `cafe_member` references Better Auth's `"user"` table.

**The repository contains only the application migrations; the Better Auth tables must be initialized separately using Better Auth's migration tooling.** Ensure that tooling receives the required environment variables, since tools run outside Next.js may not load `.env.local` automatically.

With the auth tables in place, run the following once against a fresh application database. Set `DATABASE_URL` in your shell to the same connection string used in `.env.local`:

```bash
export DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/blendhub'
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/001_create_cafes.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/002_create_menu_items.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/003_add_menu_item_images.sql
```

These SQL files create the café and membership tables, menu items, and image fields. They are not designed to be reapplied to an already migrated database.

### 4. Start the app

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Register at `/auth/register`, sign in, and create a café from `/dashboard`. Open the café to manage its menu.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```text
app/
  api/auth/[...all]/       Better Auth API handler
  auth/                   Login, registration, and password recovery
  dashboard/              Account dashboard
    cafe/[cafeId]/        Café menu and owner actions
  setup-cafe/             Café creation
database/migrations/      PostgreSQL application migrations
lib/                      Auth, database, and Cloudinary integrations
public/                   Static assets
```

## Production setup

Configure the environment variables on the hosting platform, initialize the database schema, and apply any outstanding migrations before using the app. Set `BETTER_AUTH_URL` to the deployed origin and register the corresponding `/api/auth/callback/google` redirect URI with Google.

Use a Node.js runtime that supports PostgreSQL connections, Nodemailer, and the Cloudinary SDK. Build with `npm run build` and serve with `npm start`.
