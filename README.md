# Jour J — Next.js + Tailwind CSS

Application web de gestion de mariage (PWA responsive). Code source complet,
porté depuis le prototype HTML, en **Next.js 14 (App Router) · TypeScript · Tailwind CSS**.

## Démarrage

```bash
cd jour-j-nextjs
npm install
npm run dev
# http://localhost:3000  → redirige vers /dashboard
```

> Le projet n'a pas été buildé dans l'environnement de conception : lancez
> `npm install && npm run dev` chez vous pour valider. Aucune dépendance exotique
> (Next, React, lucide-react, Tailwind).

## Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router, RSC + client components) |
| Langage | TypeScript |
| Styles | Tailwind CSS 3 + variables CSS (thèmes clair/sombre) |
| Icônes | `lucide-react` |
| État | React Context (`components/providers.tsx`) — aucune lib externe |
| Police | Geist & Geist Mono via `next/font/google` |

## Arborescence

```
jour-j-nextjs/
├── app/
│   ├── layout.tsx            # <html>, polices, <Providers>
│   ├── globals.css           # tokens (couleurs/ombres) + thèmes + @layer components
│   ├── page.tsx              # redirige vers /dashboard
│   ├── login/page.tsx        # écran de connexion (hors shell)
│   └── (app)/                # groupe de routes avec le shell (sidebar/topbar/bottom-nav)
│       ├── layout.tsx        # <AppShell>
│       ├── dashboard/page.tsx
│       ├── dates/page.tsx
│       ├── guests/page.tsx       # liste + cards + plan de table (drag & drop) + hébergements
│       ├── vendors/page.tsx      # devis + scoring A/B/C + comparateur pondéré
│       ├── budget/page.tsx       # camembert + répartition + qui paie quoi
│       ├── payments/page.tsx     # timeline + filtres + cash + soldes
│       ├── checklist/page.tsx    # catégories + sous-tâches + mode Jour J
│       └── settings/page.tsx
├── components/
│   ├── providers.tsx         # StoreProvider, ThemeProvider, Toast + hooks (useStore/useTheme/useToast)
│   ├── shell.tsx             # AppShell (responsive) + PageHead
│   ├── ui.tsx                # kit UI : Button, Card, Badge, Input, Select, Modal, Drawer, Ring, Donut…
│   └── icon.tsx              # <Icon name="…"> (mapping lucide) + <Logo>
├── lib/
│   ├── types.ts              # types du domaine
│   ├── data.ts               # données neutres initiales (couple fictif, prestataires, budget…)
│   └── format.ts             # helpers € / dates FR / J-xx
├── tailwind.config.ts
├── globals.css (dans app/)
└── tsconfig.json (alias @/* → racine)
```

## Design system

Les couleurs sont des **variables CSS** définies dans `app/globals.css` (thème clair par
défaut + `[data-theme="dark"]`), exposées à Tailwind dans `tailwind.config.ts` :

- `primary` (orange terre) · `gold` (jaune) · `sage` (succès) · `coral` (alerte)
- neutres beige pastel : `bg`, `surface`, `surface-2/3`, `line`, `text`, `text-2/3`
- helpers : `bg-primary`, `text-text-2`, `border-line`, `shadow-md`, `rounded-card`…

> Les modificateurs d'opacité (`bg-primary/50`) ne marchent pas sur ces tokens
> (ce sont des `var()`). Utilisez les variantes `-soft` / `-softer`.

Le thème est piloté par `data-theme` sur `<html>` via `useTheme()` (persisté en `localStorage`).

## État / données

`components/providers.tsx` expose un store minimal :

```tsx
const { state, update } = useStore();
update("guests", (list) => [...list, nouvelInvite]); // mise à jour immuable
```

Les données initiales sont dans `lib/data.ts`. **Pour brancher une vraie API**, remplacez
`initialState` par un fetch (Server Component / route handler / React Query) et conservez la
forme des types de `lib/types.ts`. Les actions (`toast(...)`, exports PDF, import CSV, envoi
de rappels) sont actuellement simulées — branchez-y vos endpoints.

## Intégrer dans un projet Next.js existant

1. Copiez `components/`, `lib/`, et les routes de `app/(app)/` + `app/login/`.
2. Fusionnez `tailwind.config.ts` (clé `theme.extend`) et collez le bloc tokens + `@layer`
   de `app/globals.css` dans votre CSS global.
3. Assurez l'alias `@/*` dans `tsconfig.json` (ou adaptez les imports).
4. Enveloppez la zone applicative avec `<Providers>` (déjà fait dans `app/layout.tsx`).
5. `npm i lucide-react` si absent.

## Notes

- **Auth** : `/login` est une maquette (redirige vers `/dashboard`). Branchez votre
  solution (NextAuth, Clerk, Supabase…) et protégez le groupe `(app)`.
- **Responsive** : sidebar desktop, bottom-bar + menu plein écran sur mobile (`md` breakpoint).
- **Accessibilité** : focus visibles, `role="switch"`, contrastes AA sur les surfaces beige.
