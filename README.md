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

### Design System 📸 (important)
**(Almost) all UI colours should use our Figma-derived colour tokens.** We run [Tailwind CSS](https://tailwindcss.com/) v4 with custom colour utilities that mirror design system variables declared in `src/styles.css`. **Do not use default Tailwind/shadcn palettes.**

Our colour tokens follow this naming convention:
- **Text colours:** `text-text-{variant}` → `text-text-primary`, `text-text-secondary`
- **Background colours:** `bg-bg-{variant}` → `bg-bg-main`, `bg-bg-pane-container`
- **Border colours:** `border-border-{variant}` → `border-border-subtle`, `border-border-active`

The double prefix (e.g., `text-text-*`) is intentional - it's how Tailwind generates utilities from our `--colour-text-*` theme tokens. There are a couple of exceptions for one-off components, but in general, please try to follow this convention and use the predefined variables to maintain parity with Figma.

When adding a new component from shadcn or another component library, replace all of the colour styles in the component with our own.

**Examples:**
```tsx
// Text
<h1 className="text-text-primary">Primary Heading</h1>
<p className="text-text-secondary">Secondary text</p>
<span className="text-text-error">Error message</span>

// Backgrounds
<div className="bg-bg-pane-container border border-border-subtle">
  ...
</div>
```

💡 See `src/styles.css` (`@theme inline` section) for the complete list of available colour tokens.

### Formatting and Linting
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
