# Next.js Init Template 🚀

A minimal, reusable Next.js initialization template for starting new projects quickly.

## 📦 What's Included

This template provides a complete foundation with:

- **Next.js 16.0.0** with App Router
- **React 19.2.0** with TypeScript 5
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library (New York style)
- **Zustand** for state management
- **TanStack Query** for server state
- **pnpm** package manager (v10.6.5)
- Complete ESLint + Prettier setup with import sorting
- Dark mode support with next-themes

## 🏗️ Folder Structure

```
├── actions/              # Server actions
├── app/                  # Next.js App Router
│   ├── (routes)/        # Route groups
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/
│   ├── chat/           # Chat components
│   ├── experience/     # Experience components
│   ├── provider/       # Context providers
│   └── ui/             # shadcn/ui components
├── config/             # Configuration files
├── connector/          # API connectors
├── constants/          # App constants
├── helper/             # Helper utilities
├── hooks/              # Custom React hooks
├── lib/                # Core libraries
├── public/             # Static assets
├── services/           # Business logic
├── store/              # Zustand stores
├── types/              # TypeScript types
└── zod-schema/         # Zod schemas
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file:

```env
# Add your environment variables here
NEXT_PUBLIC_API_URL=
```

### 3. Initialize shadcn/ui

```bash
npx shadcn@latest init
```

When prompted, the configuration is already set in `components.json`.

### 4. Add shadcn/ui Components

```bash
# Add components as needed
npx shadcn@latest add button
npx shadcn@latest add dropdown-menu
npx shadcn@latest add label
npx shadcn@latest add separator
npx shadcn@latest add tooltip
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 🔄 Using This Template for New Projects

### Option 1: Direct Copy

1. Copy this entire directory to your new project location
2. Remove the `.git` folder if you want a fresh git history
3. Update `package.json` name field
4. Run `pnpm install`
5. Start building!

### Option 2: Create New from Template

```bash
# Copy template to new location
cp -r next-js-temp my-new-project
cd my-new-project

# Remove git history (optional)
rm -rf .git

# Initialize new git repo (optional)
git init

# Update package name in package.json
# Then install dependencies
pnpm install
```

## 🎨 Key Technologies

- **Framework**: Next.js 16.0.0 with App Router
- **UI**: Tailwind CSS v4 + shadcn/ui (Radix UI)
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)
- **Real-time**: Socket.IO Client + LiveKit

## 📝 Configuration Files

All configuration files are pre-configured and ready to use:

- `tsconfig.json` - TypeScript with path aliases (`@/*`)
- `next.config.ts` - Image optimization and remote patterns
- `eslint.config.mjs` - Next.js + TypeScript linting
- `.prettierrc.json` - Code formatting with import sorting
- `postcss.config.mjs` - Tailwind CSS v4 setup
- `components.json` - shadcn/ui configuration

## 🌙 Dark Mode

Dark mode is built-in using `next-themes`. Toggle it in your app or use system preferences.

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand.docs.pmnd.rs)

## 📄 License

This template is open source and available for any project.

---

**Happy coding! 🎉**
