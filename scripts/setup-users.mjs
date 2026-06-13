import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://sxoocdnedizxlegwshxl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4b29jZG5lZGl6eGxlZ3dzaHhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDgzNDA2NywiZXhwIjoyMDk2NDEwMDY3fQ.PcdeyN3tE1Ttd8nys46U0yICD2h5BLbqvdr6dOxga3I',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

console.log('── Utilisateurs ───────────────────────────────────────\n')

const { data: { users } } = await sb.auth.admin.listUsers()

// ── Camille ───────────────────────────────────────────────────
let camilleId = users.find(u => u.email === 'camille@jourj.fr')?.id ?? null

if (camilleId) {
  console.log('✓ Camille déjà créée :', camilleId)
} else {
  const { data, error } = await sb.auth.admin.createUser({
    email: 'camille@jourj.fr',
    password: 'Camille123!',
    email_confirm: true,
    user_metadata: { full_name: 'Camille Laurent' },
  })
  if (error) { console.error('✗ Camille :', error.message); process.exit(1) }
  camilleId = data.user.id
  console.log('✓ Camille créée :', camilleId)
}

// ── Jonas ─────────────────────────────────────────────────────
let jonas = users.find(u => u.email === 'jonas.sitbon@gmail.com') ?? null

if (jonas) {
  console.log('✓ Jonas déjà créé :', jonas.id)
} else {
  const { data, error } = await sb.auth.admin.createUser({
    email: 'jonas.sitbon@gmail.com',
    password: 'Jonas123!',
    email_confirm: true,
    user_metadata: { full_name: 'Jonas Sitbon' },
  })
  if (error) console.error('✗ Jonas :', error.message)
  else {
    jonas = data.user
    console.log('✓ Jonas créé     :', jonas.id)
  }
}

// ── Liaison mariage démo → Camille ───────────────────────────
console.log('\n── Liaison données ────────────────────────────────────\n')

const { error: wErr } = await sb.from('wedding').update({ user_id: camilleId }).eq('id', 1)

if (wErr) {
  console.log('✗ Impossible de lier le mariage :', wErr.message)
  console.log('\n  ⚠ La migration SQL n\'a pas encore été exécutée.')
  console.log('  → Ouvre Supabase > SQL Editor et exécute supabase/migration.sql')
  console.log('  → Puis relance ce script : node scripts/setup-users.mjs\n')
  process.exit(1)
}

console.log('✓ Mariage démo (id=1) lié à Camille')

const tables = ['guests','seating_tables','vendors','budget_posts','contributions',
                'payments','tasks','day_j','date_candidates','members','notifications']

for (const t of tables) {
  const { error } = await sb.from(t).update({ wedding_id: 1 }).is('wedding_id', null)
  if (error) console.log(`  ⚠ ${t} : ${error.message}`)
  else       console.log(`✓ ${t} → wedding_id = 1`)
}

// S'assurer que Jonas n'a PAS de mariage lié
if (jonas) {
  await sb.from('wedding').update({ user_id: null }).eq('user_id', jonas.id)
  console.log('\n✓ Jonas → aucun mariage lié (il passera par l\'onboarding)')
}

console.log('\n── Résumé ──────────────────────────────────────────────')
console.log('  Camille  →  camille@jourj.fr   /  Camille123!')
console.log('  Jonas    →  jonas.sitbon@gmail.com  /  ton mot de passe Supabase')
console.log('  ✓ Camille voit les données démo')
console.log('  ✓ Jonas arrive sur l\'onboarding et crée son mariage')
console.log('────────────────────────────────────────────────────────\n')
