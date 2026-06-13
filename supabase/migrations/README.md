# Migrations Supabase

À partir de maintenant, les migrations passent par le **CLI Supabase**
(dossier `supabase/migrations/`, fichiers horodatés), au lieu des fichiers
SQL collés à la main.

## ⚠️ Migrations historiques

Les fichiers `../migration*.sql` (et `../rls.sql`, `../seed.sql`) à la racine de
`supabase/` sont l'**historique appliqué manuellement** sur la base de prod.
Ils restent là pour référence mais ne sont **pas** gérés par le CLI. Ne pas les
re-jouer via le CLI.

## Première liaison (à faire une fois, par toi — nécessite ton login)

```bash
npx supabase login                       # ouvre le navigateur
npx supabase link --project-ref <REF>    # REF = Settings → General → Reference ID
```

Comme la base existe déjà (créée à la main), il faut indiquer au CLI que tout
l'historique est **déjà appliqué**, sinon `db push` tenterait de tout rejouer :

```bash
# Génère le schéma actuel de la prod comme migration de base
npx supabase db pull            # crée un fichier de baseline ici
# puis marque-le comme déjà appliqué
npx supabase migration repair --status applied <timestamp_du_fichier>
```

## Workflow courant

```bash
npm run db:new ma_modification   # crée supabase/migrations/<ts>_ma_modification.sql
# … écris ton SQL dans le fichier généré …
npm run db:push                  # applique les nouvelles migrations à la prod liée
```

`npm run db:diff` génère une migration à partir des changements faits dans le
Studio ; `npm run db:pull` récupère le schéma distant.
