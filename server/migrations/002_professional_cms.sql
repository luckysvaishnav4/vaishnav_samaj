alter table community_users
  add column if not exists is_suspended boolean not null default false;

alter table community_profiles
  add column if not exists is_approved boolean not null default true;

create index if not exists community_profiles_public_directory_idx
  on community_profiles (visibility, updated_at desc)
  where is_approved;

create table if not exists community_gotras (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 120),
  tradition text not null default '',
  description text not null default '',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists community_gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  category text not null default 'Community' check (char_length(category) between 1 and 80),
  image_url text not null check (char_length(image_url) between 1 and 2000),
  shape text not null default '' check (shape in ('', 'wide', 'tall')),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists community_site_pages (
  page_key text primary key check (page_key in ('home', 'about', 'contact')),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into community_gotras (name, tradition, description, sort_order)
values
  ('अग्रावत', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 1),
  ('अनन्तानन्दी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 2),
  ('अनुभवानन्दी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 3),
  ('अलखानन्दी', 'सम्प्रदाय की पुष्टि बाकी', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 4),
  ('कर्मचन्दी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 5),
  ('कालू जी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 6),
  ('कीलावत', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 7),
  ('कुबावत', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 8),
  ('खोजी जी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 9),
  ('जंगीजी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 10),
  ('लाहारामी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 11),
  ('टीलावत', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 12),
  ('तनतुलसी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 13),
  ('दिवाकर', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 14),
  ('देवमुरारी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 15),
  ('धूंध्यानन्दी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 16),
  ('नरहर्यानन्दी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 17),
  ('नाभाजी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 18),
  ('पीपावत', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 19),
  ('पूर्ण बैराठी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 20),
  ('भगवन्ननारायणी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 21),
  ('भड़गी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 22),
  ('भावानन्दी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 23),
  ('मलूकिया', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 24),
  ('योगानन्दी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 25),
  ('रामकबीर', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 26),
  ('राघवचेतनी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 27),
  ('रामथंमणा', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 28),
  ('रामरामायणी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 29),
  ('रामरावली', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 30),
  ('रामरंगी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 31),
  ('लालतुरंगी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 32),
  ('सुखानन्दी', 'रामावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 33),
  ('सुरसुरानन्दी', 'सम्प्रदाय की पुष्टि बाकी', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 34),
  ('हठीनारायणी', 'सम्प्रदाय की पुष्टि बाकी', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 35),
  ('हनुमानी', 'सम्प्रदाय की पुष्टि बाकी', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 36),
  ('केशवव्याणी', 'निमावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 37),
  ('घमंडी', 'निमावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 38),
  ('चित्रानागा', 'निमावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 39),
  ('चर्तुभुजी', 'निमावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 40),
  ('तत्ववेदी', 'निमावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 41),
  ('परशुरामी', 'निमावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 42),
  ('मधवकाणी', 'निमावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 43),
  ('राधावल्लभी', 'निमावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 44),
  ('लपरागोपाली', 'निमावत सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 45),
  ('वीरमत्यागी', 'सम्प्रदाय की पुष्टि बाकी', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 46),
  ('शोभावत', 'सम्प्रदाय की पुष्टि बाकी', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 47),
  ('ऋषिकेशवी', 'सम्प्रदाय की पुष्टि बाकी', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 48),
  ('गोकुलानन्दी', 'विष्णुस्वामी सम्प्रदाय', 'आपकी साझा की गई विष्णुस्वामी सम्प्रदाय की गोत्र सूची में शामिल।', 49),
  ('विट्ठलानन्दी', 'विष्णुस्वामी सम्प्रदाय', 'आपकी साझा की गई विष्णुस्वामी सम्प्रदाय की गोत्र सूची में शामिल।', 50),
  ('नित्यानन्दी', 'माध्व/गौड़ीय सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 51),
  ('श्यामानन्दी', 'माध्व/गौड़ीय सम्प्रदाय', 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।', 52)
on conflict (name) do nothing;

insert into community_gallery (title, category, image_url, shape, is_published)
values
  ('Festival of lights', 'Celebrations', 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1000&q=85', 'wide', true),
  ('Together is our favourite place', 'Community', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=85', 'tall', true),
  ('A night of colour & joy', 'Culture', 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=900&q=85', '', true),
  ('Making memories together', 'Community', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85', '', true),
  ('Traditions that bring us home', 'Celebrations', 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=900&q=85', 'tall', true),
  ('Our heritage, our pride', 'Culture', 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1000&q=85', 'wide', true)
on conflict do nothing;

insert into community_site_pages (page_key, content)
values
  ('home', '{"kicker":"OUR HERITAGE. OUR HOME.","titleLine1":"Rooted in values.","titleLine2":"Connected for life.","description":"A welcoming home for Vaishnav families to celebrate our traditions, strengthen our bonds and shape the future together."}'::jsonb),
  ('about', '{"bannerKicker":"Our roots. Our shared future.","bannerTitle":"A community shaped by faith and belonging.","bannerDescription":"Vaishnav Samaj is more than a shared name — it is a living bond between families, generations and values.","introTitle":"A tradition of togetherness","introParagraph1":"Across generations, Vaishnav families have held close to a simple belief: that faith is strengthened by compassion, family by respect and community by showing up for one another. Our Samaj is a place to honour that belief.","introParagraph2":"We bring members together to celebrate our cultural heritage, support one another through life’s milestones and create meaningful opportunities for the next generation.","quote":"Our identity is not only what we inherit — it is what we choose to share."}'::jsonb),
  ('contact', '{"city":"Ahmedabad, Gujarat, India","phone":"Office number to be confirmed","phoneNote":"Replace with verified Samaj office number","whatsapp":"Office contact to be confirmed","whatsappNote":"No active Samaj WhatsApp account is configured","email":"Office email to be confirmed","emailNote":"Replace with a verified Samaj office address","address":"Ahmedabad, Gujarat, India","mapUrl":"https://www.google.com/maps/search/?api=1&query=Ahmedabad%2C%20Gujarat"}'::jsonb)
on conflict (page_key) do nothing;
