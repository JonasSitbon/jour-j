-- ============================================================
-- JOUR J — Migration complète
-- Colle ce fichier dans l'éditeur SQL de Supabase et exécute-le.
-- ============================================================

-- ── Tables ───────────────────────────────────────────────────

create table if not exists wedding (
  id              int primary key default 1,
  partner_a       text not null default 'Camille',
  partner_b       text not null default 'Alex',
  date            text not null default '2027-06-12',
  venue           text not null default '',
  city            text not null default '',
  theme           text not null default '',
  guest_target    int  not null default 100,
  budget_total    numeric not null default 42000,
  selected_date   int  not null default 1
);

create table if not exists guests (
  id          bigint  primary key,
  name        text    not null,
  side        text    not null,
  rsvp        text    not null,
  diet        text    not null,
  table_id    int,
  lodging     text    not null default '',
  child       boolean not null default false,
  transport   boolean not null default false,
  gift        boolean not null default false,
  group_name  text    not null default '',
  note        text    not null default ''
);

create table if not exists seating_tables (
  id       int  primary key,
  name     text not null,
  capacity int  not null
);

create table if not exists vendor_cats (
  id    text primary key,
  label text not null,
  icon  text not null
);

create table if not exists vendors (
  id            bigint  primary key,
  cat           text    not null,
  name          text    not null,
  total         numeric not null default 0,
  status        text    not null,
  score         text    not null,
  scores        jsonb   not null default '{}',
  included      text    not null default '',
  contact       text    not null default '',
  phone         text    not null default '',
  email         text    not null default '',
  last_contact  text    not null default '',
  docs          int     not null default 0
);

create table if not exists budget_posts (
  id       bigint  primary key,
  label    text    not null,
  cat      text    not null,
  planned  numeric not null,
  spent    numeric not null,
  rule     text    not null,
  custom   jsonb
);

create table if not exists contributions (
  id     text    primary key,
  label  text    not null,
  amount numeric not null
);

create table if not exists payments (
  id        bigint  primary key,
  vendor    text    not null,
  label     text    not null,
  amount    numeric not null,
  due       text    not null,
  paid_date text,
  who       text    not null,
  method    text    not null,
  status    text    not null,
  receipt   int     not null default 0
);

create table if not exists tasks (
  id    bigint  primary key,
  cat   text    not null,
  title text    not null,
  due   text    not null,
  who   text    not null,
  done  boolean not null default false,
  subs  jsonb   not null default '[]',
  link  text    not null default '',
  note  text    not null default ''
);

create table if not exists checklist_cats (
  id    text primary key,
  label text not null,
  icon  text not null
);

create table if not exists day_j (
  id   text primary key,
  t    text not null,
  done int  not null default 0
);

create table if not exists date_candidates (
  id            int primary key,
  date          text not null,
  weather       int  not null,
  sun           int  not null,
  rain          int  not null,
  temp          int  not null,
  holidays      int  not null,
  long_weekend  int  not null,
  availability  int  not null,
  best          int  not null
);

create table if not exists holidays (
  date  text primary key,
  label text not null
);

create table if not exists weather_by_month (
  m    text primary key,
  sun  int  not null,
  rain int  not null,
  temp int  not null
);

create table if not exists members (
  id     bigint primary key,
  name   text   not null,
  role   text   not null,
  email  text   not null,
  access text   not null
);

create table if not exists notifications (
  id    bigint primary key,
  type  text   not null,
  title text   not null,
  body  text   not null,
  time  text   not null,
  read  int    not null default 0
);

-- ── Désactiver RLS (développement) ──────────────────────────
alter table wedding          disable row level security;
alter table guests           disable row level security;
alter table seating_tables   disable row level security;
alter table vendor_cats      disable row level security;
alter table vendors          disable row level security;
alter table budget_posts     disable row level security;
alter table contributions    disable row level security;
alter table payments         disable row level security;
alter table tasks            disable row level security;
alter table checklist_cats   disable row level security;
alter table day_j            disable row level security;
alter table date_candidates  disable row level security;
alter table holidays         disable row level security;
alter table weather_by_month disable row level security;
alter table members          disable row level security;
alter table notifications    disable row level security;

-- ── Seed ─────────────────────────────────────────────────────

insert into wedding (id, partner_a, partner_b, date, venue, city, theme, guest_target, budget_total, selected_date)
values (1, 'Camille', 'Alex', '2027-06-12', 'Domaine des Tilleuls', 'Aix-en-Provence', 'Champêtre élégant', 120, 42000, 1)
on conflict (id) do nothing;

insert into guests (id, name, side, rsvp, diet, table_id, lodging, child, transport, gift, group_name, note) values
  (1,  'Sophie Laurent',    'A', 'yes',     'none',         1,    'sur place', false, false, true,  'Famille Laurent',   'Tante de Camille'),
  (2,  'Marc Laurent',      'A', 'yes',     'none',         1,    'sur place', false, false, true,  'Famille Laurent',   ''),
  (3,  'Léa Laurent',       'A', 'yes',     'vegetarien',   1,    'sur place', true,  false, false, 'Famille Laurent',   ''),
  (4,  'Thomas Mercier',    'A', 'yes',     'none',         2,    'hôtel',     false, true,  true,  'Amis Camille',      ''),
  (5,  'Julie Mercier',     'A', 'pending', 'vegan',        2,    '',          false, true,  false, 'Amis Camille',      'Relancer'),
  (6,  'Antoine Dubois',    'A', 'yes',     'sans gluten',  2,    'hôtel',     false, false, false, 'Amis Camille',      ''),
  (7,  'Clara Petit',       'A', 'declined','none',         null, '',          false, false, false, 'Amis Camille',      'Indisponible'),
  (8,  'Nicolas Roy',       'A', 'pending', 'none',         null, '',          false, false, false, 'Collègues Camille', ''),
  (9,  'Émilie Roy',        'A', 'pending', 'none',         null, '',          false, false, false, 'Collègues Camille', ''),
  (10, 'Pierre Garnier',    'B', 'yes',     'none',         3,    'sur place', false, false, true,  'Famille Garnier',   'Oncle d''Alex'),
  (11, 'Hélène Garnier',    'B', 'yes',     'none',         3,    'sur place', false, false, true,  'Famille Garnier',   ''),
  (12, 'Lucas Garnier',     'B', 'yes',     'none',         3,    'sur place', true,  false, false, 'Famille Garnier',   ''),
  (13, 'Manon Girard',      'B', 'yes',     'vegetarien',   4,    'hôtel',     false, true,  false, 'Amis Alex',         ''),
  (14, 'Hugo Girard',       'B', 'yes',     'none',         4,    'hôtel',     false, true,  true,  'Amis Alex',         ''),
  (15, 'Sarah Bonnet',      'B', 'pending', 'none',         null, '',          false, false, false, 'Amis Alex',         'A confirmé verbalement'),
  (16, 'Raphaël Fontaine',  'B', 'yes',     'sans lactose', 4,    '',          false, false, false, 'Amis Alex',         ''),
  (17, 'Inès Chevalier',    'B', 'yes',     'none',         3,    'sur place', false, false, false, 'Collègues Alex',    ''),
  (18, 'Maxime Lefevre',    'B', 'declined','none',         null, '',          false, false, false, 'Collègues Alex',    ''),
  (19, 'Camille Noël',      'A', 'yes',     'none',         1,    'sur place', false, false, true,  'Famille Laurent',   ''),
  (20, 'Élodie Bertrand',   'B', 'pending', 'vegetarien',   null, '',          false, false, false, 'Amis Alex',         '')
on conflict (id) do nothing;

insert into seating_tables (id, name, capacity) values
  (1, 'Table d''honneur', 8),
  (2, 'Table 2', 8),
  (3, 'Table 3', 10),
  (4, 'Table 4', 10),
  (5, 'Table 5', 10)
on conflict (id) do nothing;

insert into vendor_cats (id, label, icon) values
  ('salle',      'Salle',                  'home'),
  ('traiteur',   'Traiteur',               'cake'),
  ('photo',      'Photographe',            'camera'),
  ('video',      'Vidéaste',               'eye'),
  ('dj',         'DJ / Groupe',            'music'),
  ('fleurs',     'Fleuriste',              'flower'),
  ('voiture',    'Voiture',                'car'),
  ('fairepart',  'Faire-part',             'mail'),
  ('gateau',     'Gâteau',                 'cake'),
  ('beaute',     'Coiffure / Maquillage',  'sparkle'),
  ('officiant',  'Officiant',              'heart'),
  ('honeymoon',  'Voyage de noces',        'pin'),
  ('divers',     'Divers',                 'dots')
on conflict (id) do nothing;

insert into vendors (id, cat, name, total, status, score, scores, included, contact, phone, email, last_contact, docs) values
  (1, 'salle',    'Domaine des Tilleuls', 7800, 'signed',  'A', '{"prix":4,"qualite":5,"reactivite":5,"references":5,"flexibilite":4}', 'Location week-end complet, mobilier, parking',    'Mme Rousseau', '06 12 34 56 78', 'contact@domainedesuilleuls.fr', '2026-05-28', 1),
  (2, 'salle',    'Château de la Brède',  9200, 'declined', 'B', '{"prix":2,"qualite":5,"reactivite":3,"references":4,"flexibilite":2}', 'Location samedi, hébergement 12 pers.',            'M. Albert',     '06 12 34 56 78', 'contact@chateaudelabrde.fr',    '2026-04-10', 0),
  (3, 'traiteur', 'Saveurs & Co',         9600, 'pending',  'A', '{"prix":4,"qualite":5,"reactivite":4,"references":4,"flexibilite":4}', 'Cocktail + dîner 3 plats, 120 couverts',           'Chef Morel',    '06 12 34 56 78', 'contact@saveurscode.fr',        '2026-05-30', 0),
  (4, 'traiteur', 'Table Provençale',     8400, 'pending',  'B', '{"prix":5,"qualite":3,"reactivite":2,"references":3,"flexibilite":4}', 'Buffet + dîner, 120 couverts',                     'M. Pons',       '06 12 34 56 78', 'contact@tableprovencale.fr',    '2026-05-02', 0),
  (5, 'photo',    'Studio Lumière',       2600, 'signed',   'A', '{"prix":4,"qualite":5,"reactivite":5,"references":5,"flexibilite":5}', 'Journée complète, album, galerie en ligne',        'Léa Martin',    '06 12 34 56 78', 'contact@studiolumire.fr',       '2026-05-20', 1),
  (6, 'dj',       'Sono Events',          1400, 'pending',  'B', '{"prix":4,"qualite":4,"reactivite":5,"references":3,"flexibilite":4}', 'DJ soirée, matériel, jeux de lumière',             'DJ Kévin',      '06 12 34 56 78', 'contact@sonoevents.fr',         '2026-05-18', 0),
  (7, 'fleurs',   'Atelier Floral',       1800, 'pending',  'B', '{"prix":3,"qualite":5,"reactivite":2,"references":4,"flexibilite":3}', 'Bouquet, centres de table, arche',                 'Mme Vidal',     '06 12 34 56 78', 'contact@atelierfloral.fr',      '2026-04-22', 0),
  (8, 'video',    'Ciné Moments',         2200, 'pending',  'B', '{"prix":3,"qualite":4,"reactivite":3,"references":4,"flexibilite":3}', 'Film 5 min + cérémonie intégrale',                 'M. Faure',      '06 12 34 56 78', 'contact@cinmoments.fr',         '2026-05-12', 0)
on conflict (id) do nothing;

insert into budget_posts (id, label, cat, planned, spent, rule, custom) values
  (1,  'Salle & réception',       'salle',     8000,  7800, 'split50',  null),
  (2,  'Traiteur & boissons',     'traiteur',  10000, 9600, 'byGuests', null),
  (3,  'Photographe',             'photo',     2800,  2600, 'split50',  null),
  (4,  'Vidéaste',                'video',     2200,  0,    'split50',  null),
  (5,  'DJ / Animation',          'dj',        1500,  1400, 'onlyB',    null),
  (6,  'Fleurs & décoration',     'fleurs',    2000,  1800, 'onlyA',    null),
  (7,  'Tenues & beauté',         'beaute',    3500,  1200, 'custom',   '{"A":70,"B":30}'),
  (8,  'Faire-part & papeterie',  'fairepart', 800,   650,  'split50',  null),
  (9,  'Gâteau',                  'gateau',    600,   0,    'split50',  null),
  (10, 'Voiture',                 'voiture',   700,   0,    'onlyB',    null),
  (11, 'Voyage de noces',         'honeymoon', 4000,  1000, 'split50',  null),
  (12, 'Divers & imprévus',       'divers',    1500,  320,  'split50',  null)
on conflict (id) do nothing;

insert into contributions (id, label, amount) values
  ('famA', 'Famille de Camille', 6000),
  ('famB', 'Famille de Alex',    4000)
on conflict (id) do nothing;

insert into payments (id, vendor, label, amount, due, paid_date, who, method, status, receipt) values
  (1, 'Domaine des Tilleuls', 'Acompte salle (30%)', 2340, '2026-03-15', '2026-03-12', 'A', 'virement', 'paid',     1),
  (2, 'Studio Lumière',       'Acompte photo',        800,  '2026-04-01', '2026-04-01', 'B', 'virement', 'paid',     1),
  (3, 'Atelier Floral',       'Arrhes fleurs',        500,  '2026-05-10', '2026-05-09', 'A', 'cheque',   'paid',     1),
  (4, 'Domaine des Tilleuls', 'Solde salle',          5460, '2026-09-15', null,         'A', 'virement', 'upcoming', 0),
  (5, 'Saveurs & Co',         'Acompte traiteur',     2880, '2026-06-01', null,         'B', 'virement', 'late',     0),
  (6, 'Sono Events',          'Acompte DJ',           420,  '2026-06-20', null,         'B', 'cash',     'upcoming', 0),
  (7, 'Studio Lumière',       'Solde photo',          1800, '2027-05-15', null,         'B', 'virement', 'upcoming', 0),
  (8, 'Saveurs & Co',         'Solde traiteur',       6720, '2027-05-20', null,         'A', 'virement', 'upcoming', 0),
  (9, 'Ciné Moments',         'Acompte vidéo',        660,  '2026-06-30', null,         'B', 'cheque',   'upcoming', 0)
on conflict (id) do nothing;

insert into tasks (id, cat, title, due, who, done, subs, link, note) values
  (1,  'admin',    'Réserver la date en mairie',         '2026-09-12', 'A', false, '[{"t":"Prendre rendez-vous","d":1},{"t":"Constituer le dossier","d":0}]', '', ''),
  (2,  'admin',    'Dossier de mariage complet',         '2026-12-12', 'B', false, '[{"t":"Actes de naissance","d":1},{"t":"Justificatifs de domicile","d":0},{"t":"Liste des témoins","d":0}]', '', ''),
  (3,  'lieu',     'Signer le contrat de la salle',      '2026-05-30', 'A', true,  '[]', '', ''),
  (4,  'lieu',     'Visiter et choisir l''hébergement invités', '2026-08-01', 'A', false, '[{"t":"Hôtel à proximité","d":0},{"t":"Négocier tarif groupe","d":0}]', '', ''),
  (5,  'presta',   'Choisir le traiteur',                '2026-07-15', 'B', false, '[{"t":"Dégustation Saveurs & Co","d":1},{"t":"Dégustation Table Provençale","d":0},{"t":"Comparer les devis","d":0}]', '', ''),
  (6,  'presta',   'Confirmer le photographe',           '2026-06-15', 'A', true,  '[]', '', ''),
  (7,  'presta',   'Réserver le DJ',                     '2026-07-30', 'B', false, '[]', '', ''),
  (8,  'tenues',   'Choisir la tenue de Camille',        '2026-11-01', 'A', false, '[{"t":"Essayages","d":0},{"t":"Retouches","d":0}]', '', ''),
  (9,  'tenues',   'Costume d''Alex',                    '2026-12-01', 'B', false, '[]', '', ''),
  (10, 'invites',  'Finaliser la liste des invités',     '2026-08-30', 'A', false, '[]', '', ''),
  (11, 'invites',  'Envoyer les faire-part',             '2026-12-12', 'A', false, '[{"t":"Valider la maquette","d":0},{"t":"Impression","d":0},{"t":"Envoi","d":0}]', '', ''),
  (12, 'invites',  'Relancer les RSVP en attente',       '2027-03-01', 'B', false, '[]', '', ''),
  (13, 'deco',     'Définir la palette de décoration',   '2026-10-01', 'A', false, '[]', '', ''),
  (14, 'deco',     'Commander la papeterie de table',    '2027-02-01', 'A', false, '[]', '', ''),
  (15, 'ceremonie','Écrire les vœux',                    '2027-05-01', 'B', false, '[]', '', ''),
  (16, 'ceremonie','Choisir les musiques de cérémonie',  '2027-04-15', 'B', false, '[]', '', ''),
  (17, 'jourj',    'Préparer le timing du jour J',       '2027-06-05', 'A', false, '[]', '', ''),
  (18, 'jourj',    'Kit de secours mariée/marié',        '2027-06-11', 'A', false, '[]', '', ''),
  (19, 'apres',    'Envoyer les remerciements',          '2027-07-15', 'B', false, '[]', '', '')
on conflict (id) do nothing;

insert into checklist_cats (id, label, icon) values
  ('admin',     'Administratif',   'file'),
  ('lieu',      'Lieu & logistique','home'),
  ('presta',    'Prestataires',    'star'),
  ('tenues',    'Tenues',          'sparkle'),
  ('invites',   'Invités',         'users'),
  ('deco',      'Décoration',      'flower'),
  ('ceremonie', 'Cérémonie',       'heart'),
  ('jourj',     'Jour J',          'rings'),
  ('apres',     'Après mariage',   'gift')
on conflict (id) do nothing;

insert into day_j (id, t, done) values
  ('d1',  'Petit-déjeuner copieux',                    0),
  ('d2',  'Coiffure & maquillage',                     0),
  ('d3',  'Vérifier les alliances',                    0),
  ('d4',  'Kit de secours prêt',                       0),
  ('d5',  'Confier les paiements cash aux témoins',    0),
  ('d6',  'Bouquet récupéré',                          0),
  ('d7',  'Voiture confirmée',                         0),
  ('d8',  'Habillage',                                 0),
  ('d9',  'Photos préparatifs',                        0),
  ('d10', 'Respirer, profiter ✨',                     0)
on conflict (id) do nothing;

insert into date_candidates (id, date, weather, sun, rain, temp, holidays, long_weekend, availability, best) values
  (1, '2027-06-12', 88, 9, 12, 26, 0, 0, 92, 1),
  (2, '2027-05-29', 79, 8, 18, 22, 0, 1, 74, 0),
  (3, '2027-09-04', 82, 8, 15, 24, 0, 0, 81, 0),
  (4, '2027-07-10', 90, 10, 8, 29, 0, 0, 58, 0)
on conflict (id) do nothing;

insert into holidays (date, label) values
  ('2027-05-01', 'Fête du Travail'),
  ('2027-05-08', 'Victoire 1945'),
  ('2027-05-06', 'Ascension'),
  ('2027-05-16', 'Pentecôte'),
  ('2027-07-14', 'Fête nationale'),
  ('2027-08-15', 'Assomption')
on conflict (date) do nothing;

insert into weather_by_month (m, sun, rain, temp) values
  ('Jan', 58, 6, 9),  ('Fév', 62, 5, 10), ('Mar', 68, 6, 13),
  ('Avr', 72, 7, 16), ('Mai', 79, 6, 20), ('Juin', 88, 4, 25),
  ('Juil', 92, 2, 28),('Août', 90, 3, 28),('Sep', 82, 5, 24),
  ('Oct', 72, 7, 18), ('Nov', 62, 7, 13), ('Déc', 57, 6, 10)
on conflict (m) do nothing;

insert into members (id, name, role, email, access) values
  (1, 'Camille Laurent', 'Propriétaire',    'camille@email.fr', 'owner'),
  (2, 'Alex Garnier',    'Co-organisateur', 'alex@email.fr',    'edit'),
  (3, 'Sophie Laurent',  'Témoin',          'sophie@email.fr',  'edit'),
  (4, 'Pierre Garnier',  'Famille',         'pierre@email.fr',  'read')
on conflict (id) do nothing;

insert into notifications (id, type, title, body, time, read) values
  (1, 'alert',   'Paiement en retard', 'Acompte traiteur — Saveurs & Co (échéance dépassée)', 'il y a 2 j', 0),
  (2, 'warning', 'Échéance proche',    'Solde salle à régler avant le 15 septembre',          'il y a 1 j', 0),
  (3, 'info',    '3 RSVP en attente',  'Pensez à relancer les invités non confirmés',          'il y a 3 h', 0),
  (4, 'success', 'Devis signé',        'Studio Lumière — contrat photo confirmé',              'hier',       1)
on conflict (id) do nothing;
