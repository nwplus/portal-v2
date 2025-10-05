# nwPlus Portal v2

All-in-one platform to support nwPlus' hackathons 🚀

## Development instructions

### Setup
1. Install [pnpm](https://pnpm.io/installation)
2. Add a `.env` file with the Firebase config (use the dev secrets)
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
3. Install dependencies:
```bash
pnpm install
```
4. Start the dev server:
```bash
pnpm dev
```

## Styling, formatting, and linting
This project uses [Tailwind CSS](https://tailwindcss.com/) v4 for styling.

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:

```bash
pnpm format             # formats code styles
pnpm format:imports     # organizes imports only
pnpm lint               # performs lint checks
pnpm check              # performs formatting + lint checks (read-only)
pnpm check:write        # applies safe formatting and lint fixes
```

**Notes**
- This project uses Husky to run `pnpm check:staged` before each commit. If checks fail, the commit will be blocked and you'll see a message suggesting to run `pnpm check:write` to apply fixes
- Install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) to VSCode for auto-formatting
- To address Tailwind CSS class sorting lint warnings, just save the file

## Routing and Directory Structure

### Router
This project uses [TanStack Router](https://tanstack.com/router/latest) with file-based routing. Routes are managed as files in the `src/routes` directory. Here are some basic conventions:

- Basic routes: `src/routes/nugget.tsx` -> `/nugget`
- Index routes: `src/routes/profile/index.tsx` -> `/profile` (an index route is the default child for its parent route)
- Dynamic routes: `src/routes/profile/$id.tsx` -> `/profile/123`
- Route groups: `src/routes/_auth/application.tsx` -> `/application` (the `_auth` segment doesn't appear in the URL)
- Nested routes: `src/routes/$hackathon/schedule.tsx` -> `/hackcamp/schedule` (`hackcamp` is a valid value for `$hackathon`)

- `$` prefix: dynamic route parameter that extracts values from the URL pathname as route params ($hackathon, $id)
- `_` prefix: pathless layout route that provides shared layout/logic without affecting the URL path

Changes to routes will be reflected automatically in `src/routeTree.gen.ts` when the dev server is running. Do not edit this; it's auto-generated.

### Directory overview
```
src/
├── assets/
├── components/
│   ├── features/             # Components relevant to specific features
│   ├── layout/               # Components related to screen layouts (e.g., sidebar)
│   ├── errors/               # Error and fallback screens (e.g., 404)
│   └── ui/                   # Reusable UI components (mainly shadcn)
├── hooks/                    # Custom React hooks
├── lib/
│   ├── constants.ts          # Application constants
│   ├── types.ts              # Application types
│   ├── firebase/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── types/            # Types that match data shape on Firebase (e.g., Applicants, HackerAppQuestions)
│   ├── stores/               # Zustand stores
│   └── utils.ts
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── $activeHackathon.tsx
│   └── $activeHackathon/     # Dynamic hackathon route directory (e.g., /cmd-f/...)
│       ├── index.tsx
│       ├── _auth.tsx
│       └── _auth/            # Protected route directory
│           └── profile.tsx
├── services/                 # External integrations (e.g., subscribing to Firebase collections)
├── main.tsx
└── styles.css
```
