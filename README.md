# Jour J / The Cockpit — application de planification de mariage

Application web (PWA responsive) pour organiser un mariage de bout en bout :
invités & RSVP, budget partagé, prestataires, paiements, checklist, déroulé du
jour J, cérémonie, playlist, plan de table, moodboard, journal de bord, et
collaboration multi-utilisateurs avec rôles.

**Stack :** Next.js 14 (App Router) · TypeScript · Tailwind CSS 3 · Supabase
(Postgres + Auth + RLS + Realtime) · Vitest · déployé sur Vercel.

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigne tes clés Supabase
npm run dev                  # http://localhost:3000
```

Variables d'environnement requises (voir `.env.example`) :

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique `anon` (jamais la `service_role`) |

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm test` | Suite de tests Vitest (logique pure) |
| `npm run test:watch` | Tests en mode watch |
| `npm run lint` | ESLint (next lint) |

## Base de données & migrations

Le **CLI Supabase** est maintenant configuré (`supabase/config.toml`). Les
nouvelles migrations vont dans `supabase/migrations/` via `npm run db:new`,
puis `npm run db:push`. Voir `supabase/migrations/README.md` pour la liaison
initiale (login + baselining d'une base déjà existante).

> ⚠️ Les fichiers `supabase/migration*.sql` à la racine sont l'**historique
> appliqué manuellement** sur la prod (avant le CLI). Ils restent pour
> référence mais ne doivent pas être re-joués via le CLI. Sur une base **neuve**
> sans CLI, on peut encore les exécuter dans l'ordre dans `SQL Editor` :

1. `supabase/seed.sql` — création des tables de données
2. `supabase/rls.sql` — RLS de base (⚠️ remplacé plus bas par migration15)
3. `migration.sql` → `migration3.sql` — `user_id`, météo, villes
4. `migration5.sql`, `migration6.sql` — tokens RSVP & partage public
5. `migration7.sql` — profils, multi-mariage, `wedding_access`, rôles
6. `migration8.sql` → `migration13.sql` — journal, moodboard, cadeaux,
   cérémonie, chansons, contacts
7. `migration_rbac.sql` — permissions de rôles admin
8. `migration14_fix_rls.sql` — correctif récursion RLS
9. **`migration15_security_fix.sql`** — durcissement sécurité : supprime les
   politiques `anon` ouvertes, ajoute les RPC par token, écriture par rôle.
   Idempotent et tolérant aux tables absentes (affiche un `NOTICE`). À relancer
   après avoir créé une table manquante.
10. **`migration16_invitations_rsvp_message.sql`** — invitations
    collaborateurs fonctionnelles + message RSVP séparé de la note privée

Vérification post-migration 15 — cette requête doit renvoyer **0 ligne** :

```sql
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public' AND roles::text LIKE '%anon%';
```

### Accès public (sans compte)

Les pages publiques `/rsvp/[token]`, `/share/[token]` et `/invite/[token]`
n'interrogent **jamais** les tables directement. Elles passent par des
fonctions `SECURITY DEFINER` qui exigent le token exact et ne renvoient que les
colonnes nécessaires : `get_rsvp_info`, `submit_rsvp`, `get_share_data`,
`get_invite_info`, `accept_wedding_invite`.

## Rôles & permissions

- **Au niveau base** (source de vérité) : `has_wedding_access()` autorise la
  lecture à tout membre accepté ; `can_edit_wedding()` réserve l'écriture aux
  rôles `owner` / `admin` / `editor`. Un `viewer` est en lecture seule.
- **Au niveau UI** : `lib/roles.ts` filtre la navigation par rôle,
  `components/role-guard.tsx` bloque l'accès aux pages interdites via l'URL et
  affiche un bandeau lecture seule.

## Architecture

```
app/
  (app)/            pages authentifiées (shell + RoleGuard)
  admin/            back-office super_admin
  invite|rsvp|share/[token]/   pages publiques par token
  api/              routes serveur (recherche musique, templates email)
components/
  providers.tsx     store global (Context) + sync optimiste avec rollback
  shell.tsx         layout app (sidebar/topbar/nav par rôle)
  role-guard.tsx    garde d'accès par rôle
lib/
  db.ts             chargement + synchronisation Supabase, mappers
  budget.ts         logique de répartition du budget (testée)
  roles.ts          définition des rôles et permissions (testée)
  types.ts          types partagés
supabase/           migrations SQL (voir ci-dessus)
```

Le store (`components/providers.tsx`) applique les mutations de façon
optimiste : en cas d'échec de sauvegarde Supabase, l'état est restauré et un
toast d'erreur s'affiche.

## Tests & CI

`npm test` couvre la logique pure (répartition du budget, accès par rôle,
mappers de la base). La CI GitHub Actions (`.github/workflows/ci.yml`) exécute
typecheck + tests + build à chaque push et pull request.
