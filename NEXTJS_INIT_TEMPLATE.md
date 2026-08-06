# Next.js Project Initialization Template

This document provides a comprehensive template for initializing a Next.js project based on the **shared-next-aivah** codebase structure.

---

## 📦 Project Overview

**Project Name:** aivah_shared_next  
**Version:** 1.0.0  
**Framework:** Next.js 16.0.0  
**Package Manager:** pnpm 10.6.5  
**React Version:** 19.2.0

---

## 🏗️ Folder Structure

```
project-root/
├── .git/                      # Git repository
├── .next/                     # Next.js build output (auto-generated)
├── .vscode/                   # VS Code settings
├── actions/                   # Server actions
│   ├── get-device-info.ts
│   ├── init-layout-embed.ts
│   └── init-voice-only.ts
├── app/                       # Next.js App Router
│   ├── (routes)/             # Route groups
│   ├── favicon.ico
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   ├── logo.png
│   ├── page.tsx              # Home page
│   └── error.tsx             # Error boundary
├── components/                # React components
│   ├── chat/                 # Chat-related components
│   ├── experience/           # Experience components
│   ├── provider/             # Context providers
│   └── ui/                   # UI components (shadcn/ui)
├── config/                    # Configuration files
│   ├── env.ts                # Environment variables validation
│   └── global-event.ts       # Global event handlers
├── connector/                 # API/service connectors
│   ├── client-api.ts
│   └── livekit.ts
├── constants/                 # Application constants
│   ├── avatar/
│   └── voice-only.tsx
├── helper/                    # Helper utilities
│   ├── chat.tsx
│   ├── date-time.ts
│   ├── query-keys.ts
│   ├── storage.ts
│   └── wawa-lipsync-manager.ts
├── hooks/                     # Custom React hooks
│   ├── avatar/
│   ├── web-results/
│   ├── use-chat-scroll.ts
│   ├── use-copy-clipboard.ts
│   ├── use-mount.ts
│   ├── use-resize.ts
│   ├── use-shallow-store.ts
│   ├── use-socket.ts
│   └── use-speech-to-text.ts
├── lib/                       # Core libraries
│   ├── aivah_lipsync.ts
│   ├── avatar-lipsync-utils.ts
│   └── utils.ts              # Utility functions
├── node_modules/              # Dependencies (auto-generated)
├── public/                    # Static assets
├── services/                  # Business logic services
├── store/                     # State management (Zustand)
├── types/                     # TypeScript type definitions
├── zod-schema/                # Zod validation schemas
├── .env.local                 # Environment variables (git-ignored)
├── .gitignore
├── .prettierrc.json          # Prettier configuration
├── components.json            # shadcn/ui configuration
├── dockerfile                 # Docker configuration
├── eslint.config.mjs         # ESLint configuration
├── next.config.ts            # Next.js configuration
├── next-env.d.ts             # Next.js types (auto-generated)
├── package.json              # Dependencies and scripts
├── pnpm-lock.yaml            # pnpm lockfile
├── postcss.config.mjs        # PostCSS configuration
├── README.md
└── tsconfig.json             # TypeScript configuration
```

---

## 📄 Essential Configuration Files

### 1. **package.json**

```json
{
  "name": "aivah_shared_next",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"]
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@t3-oss/env-nextjs": "^0.13.8",
    "@tanstack/react-query": "^5.90.5",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "dayjs": "^1.11.19",
    "livekit-client": "^2.15.14",
    "lucide-react": "^0.548.0",
    "microsoft-cognitiveservices-speech-sdk": "^1.46.0",
    "motion": "^12.23.24",
    "next": "16.0.0",
    "next-themes": "^0.4.6",
    "pdfjs-dist": "^5.4.394",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "react-hook-form": "^7.66.0",
    "react-markdown": "^10.1.0",
    "react-pdf": "^10.2.0",
    "react-resizable-panels": "^3.0.6",
    "react-voice-visualizer": "^2.0.8",
    "react-youtube": "^10.1.0",
    "rehype-raw": "^7.0.0",
    "remark-gfm": "^4.0.1",
    "socket.io-client": "^4.8.1",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.3.1",
    "tailwind-scrollbar-hide": "^4.0.0",
    "uuid": "^13.0.0",
    "wawa-lipsync": "^0.0.1",
    "zod": "^4.1.12",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@trivago/prettier-plugin-sort-imports": "^6.0.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.0.0",
    "prettier": "^3.6.2",
    "prettier-plugin-tailwindcss": "^0.7.1",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5"
  },
  "packageManager": "pnpm@10.6.5+sha512.cdf928fca20832cd59ec53826492b7dc25dc524d4370b6b4adbf65803d32efaa6c1c88147c0ae4e8d579a6c9eec715757b50d4fa35eea179d868eada4ed043af"
}
```

### 2. **tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

### 3. **next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.storage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
```

### 4. **eslint.config.mjs**

```javascript
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

### 5. **.prettierrc.json**

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "importOrder": [
    "^(react|react?/?([a-zA-Z/]*)$",
    "<THIRD_PARTY_MODULES>",
    "^@feature/(.*)$",
    "^@components/(.*)$",
    "^@layout/(.*)$",
    "^@pages/(.*)$",
    "^@routes/(.*)$",
    "^@hooks/(.*)$",
    "^@store/(.*)$",
    "^@config/(.*)$",
    "^@assets/(.*)$",
    "^@/(.*)$",
    "^[./]"
  ],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true,
  "plugins": [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss"
  ]
}
```

### 6. **postcss.config.mjs**

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 7. **components.json** (shadcn/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}
```

### 8. **.gitignore**

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

certificates
```

---

## 🎨 Core Files to Create

### **app/layout.tsx**

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/provider";
import { Toaster } from "@/components/ui/sonner";
import "@/config/global-event";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | AI Avatar Agents for digital worlds",
    default: "Aivah",
  },
  description: "AI Avatar Agents for digital worlds",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

### **app/globals.css**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "tailwind-scrollbar-hide/v4";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  /* Additional theme variables... */
}

:root {
  --radius: 0.625rem;
  --background: oklch(100% 0.00011 271.152);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  /* Additional CSS variables for light theme... */
}

.dark {
  --background: oklch(20.904% 0.00002 271.152);
  --foreground: oklch(0.985 0 0);
  /* Additional CSS variables for dark theme... */
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  .flex-center {
    @apply flex items-center justify-center;
  }
}

html,
body {
  height: 100%;
}
```

### **lib/utils.ts**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 🚀 Installation Steps

### Step 1: Initialize Project

```bash
# Create new Next.js app (if starting from scratch)
npx create-next-app@latest my-project --typescript --tailwind --app --eslint

# Or clone existing project
git clone <repository-url>
cd shared-next-aivah
```

### Step 2: Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

### Step 3: Set Up Environment Variables

Create `.env.local` file in the root directory:

```env
# Add your environment variables here
NEXT_PUBLIC_API_URL=
# Add other required variables
```

### Step 4: Initialize shadcn/ui

```bash
# Initialize shadcn/ui components
npx shadcn@latest init

# Add required components
npx shadcn@latest add button
npx shadcn@latest add dropdown-menu
npx shadcn@latest add label
npx shadcn@latest add separator
npx shadcn@latest add tooltip
# Add other components as needed
```

### Step 5: Run Development Server

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Key Technologies & Libraries

### Core Framework

- **Next.js 16.0.0** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type-safe JavaScript

### Styling

- **Tailwind CSS v4** - Utility-first CSS framework
- **tailwind-merge** - Merge Tailwind classes
- **class-variance-authority** - Component variants
- **tw-animate-css** - Animation utilities

### UI Components

- **shadcn/ui** - Accessible component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **next-themes** - Dark mode support

### State Management

- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management

### Forms & Validation

- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

### Real-time & Communication

- **socket.io-client** - Real-time communication
- **livekit-client** - WebRTC client
- **microsoft-cognitiveservices-speech-sdk** - Speech services

### Utilities

- **dayjs** - Date manipulation
- **clsx** - Conditional classnames
- **uuid** - UUID generation

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **@trivago/prettier-plugin-sort-imports** - Import sorting

---

## 📝 Best Practices

### Project Organization

1. **Components** - Keep UI components in `components/` folder
2. **API Logic** - Place server actions in `actions/` folder
3. **State Management** - Store Zustand stores in `store/` folder
4. **Type Definitions** - Define types in `types/` folder
5. **Utilities** - Helper functions in `helper/` or `lib/` folders

### Code Style

1. Use TypeScript for type safety
2. Follow ESLint and Prettier rules
3. Use path aliases (`@/`) for cleaner imports
4. Implement proper error boundaries

### Performance

1. Use Next.js Image component for images
2. Implement code splitting with dynamic imports
3. Optimize bundle size with proper tree-shaking
4. Use React Server Components where applicable

---

## 🔧 Common Commands

```bash
# Development
pnpm dev              # Start dev server

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier

# Dependencies
pnpm add <package>    # Add dependency
pnpm remove <package> # Remove dependency
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Zustand Documentation](https://zustand.docs.pmnd.rs)

---

## 🎯 Next Steps

1. **Set up environment variables** in `.env.local`
2. **Configure remote services** (APIs, databases, etc.)
3. **Implement authentication** if required
4. **Add custom components** as needed
5. **Set up CI/CD pipeline** for deployment
6. **Configure Docker** for containerization (dockerfile already included)

---

This template provides a solid foundation for building modern Next.js applications with best practices and enterprise-grade architecture.
