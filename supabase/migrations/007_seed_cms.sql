-- =============================================================================
-- ASF Platform - Migration 007: Seed CMS data
-- =============================================================================
-- Seeds site_content (~80 keys), site_settings (~12 keys), management_team (8),
-- history_timeline (10), faq_items (21), gallery_images (12 Unsplash URLs added
-- to existing placeholders), news_posts (4), sponsors (7), and 3 additional
-- public events (Afghan Cup 2026 already seeded by migration 003).
--
-- All inserts are ON CONFLICT DO NOTHING so re-running this migration is safe.
-- =============================================================================

-- =============================================================================
-- SITE CONTENT  (CMS key/value)
-- =============================================================================
insert into public.site_content (content_key, content_value, content_type, label, section) values
  -- Hero
  ('hero_title',        'Afghan Sports Federation', 'text',     'Hero Main Title',      'hero'),
  ('hero_subtitle',     'Building community through sports excellence since 1998', 'text', 'Hero Subtitle', 'hero'),
  ('hero_cta_primary',  'Join the Community', 'text',           'Hero Primary Button',  'hero'),
  ('hero_cta_secondary','View Events',         'text',          'Hero Secondary Button','hero'),

  -- About teaser on homepage
  ('about_teaser_title',    'More Than Just Sports', 'text',     'About Teaser Title',  'homepage'),
  ('about_teaser_body',     'The Afghan Sports Federation has been building community through athletic excellence since 1998. We create pathways for Afghan Americans and Afghans worldwide to compete, connect, and celebrate their heritage through sport.', 'textarea', 'About Teaser Body', 'homepage'),
  ('about_teaser_bullet_1', 'Non-profit mission committed to the Afghan community', 'text', 'About Bullet 1', 'homepage'),
  ('about_teaser_bullet_2', 'Inclusive programs for all skill levels and ages',     'text', 'About Bullet 2', 'homepage'),
  ('about_teaser_bullet_3', 'Long-term vision for global Afghan sports representation', 'text', 'About Bullet 3', 'homepage'),

  -- Stats bar
  ('stat_1_number', '26+',     'text', 'Stat 1 Number', 'stats'),
  ('stat_1_label',  'Years',   'text', 'Stat 1 Label',  'stats'),
  ('stat_2_number', '1000+',   'text', 'Stat 2 Number', 'stats'),
  ('stat_2_label',  'Members', 'text', 'Stat 2 Label',  'stats'),
  ('stat_3_number', '5',       'text', 'Stat 3 Number', 'stats'),
  ('stat_3_label',  'Sports',  'text', 'Stat 3 Label',  'stats'),
  ('stat_4_number', '28+',     'text', 'Stat 4 Number', 'stats'),
  ('stat_4_label',  'Events',  'text', 'Stat 4 Label',  'stats'),

  -- Afghan Cup banner
  ('cup_banner_title',         'Afghan Cup 2026',       'text', 'Cup Banner Title',     'afghancup'),
  ('cup_banner_cta',           'Register Your Team',    'text', 'Cup Banner CTA',       'afghancup'),
  ('cup_date',                 '2026-07-02T09:00:00Z',  'text', 'Afghan Cup Date (ISO)','afghancup'),
  ('cup_location',             'Northern Virginia, USA','text', 'Afghan Cup Location',  'afghancup'),
  ('cup_registration_opens',   'April 1, 2026',         'text', 'Registration Opens',   'afghancup'),
  ('cup_registration_closes',  'June 15, 2026',         'text', 'Registration Closes',  'afghancup'),
  ('cup_eligibility',          'Open to all ASF Affiliate teams. Minimum 15 players per team. Teams must be registered on the platform before the registration deadline.', 'textarea', 'Eligibility Rules', 'afghancup'),

  -- About page
  ('about_story_title', 'Our Story', 'text', 'About Story Title', 'about'),
  ('about_story_body',  'The Afghan Sports Federation was founded in 1998 by a group of passionate Afghan Americans in the Washington D.C. metropolitan area. What began as an informal soccer league among friends grew into a structured federation representing thousands of Afghans across the United States and beyond. Over 26 years we have organized 28 Afghan Cup tournaments, launched programs in five different sports, and created a community that transcends borders. Our members include first-generation immigrants, second-generation Afghan Americans, and Afghan nationals who share one thing in common: a love of sport and a pride in their heritage.', 'textarea', 'About Story Body', 'about'),
  ('about_mission',     'To create a center of guidance for Afghan athletes who want to be active in amateur sports or pursue a professional career in any athletic field, regardless of their background or skill level.', 'textarea', 'Mission Statement', 'about'),
  ('about_vision',      'To establish an Afghan sports body worldwide, participate in the Olympic Games representing the global Afghan diaspora, and build ASF sports facilities and community centers across the United States and beyond.', 'textarea', 'Vision Statement', 'about'),
  ('about_goal_1',      'Build ASF soccer fields and community centers across the United States and worldwide within the next decade', 'text', 'Long Term Goal 1', 'about'),
  ('about_goal_2',      'Establish an officially recognized international Afghan sports body and pursue Olympic Games participation', 'text', 'Long Term Goal 2', 'about'),
  ('about_goal_3',      'Develop a fully professional Afghan soccer league that can qualify for international FIFA competitions', 'text', 'Long Term Goal 3', 'about'),

  -- Value cards
  ('value_1_title', 'Community',   'text', 'Value 1 Title', 'about'),
  ('value_1_body',  'Every Afghan, regardless of background or skill level, has a place in our community.', 'textarea', 'Value 1 Body', 'about'),
  ('value_2_title', 'Excellence',  'text', 'Value 2 Title', 'about'),
  ('value_2_body',  'We push our athletes to achieve their personal best and represent our community with pride.', 'textarea', 'Value 2 Body', 'about'),
  ('value_3_title', 'Inclusivity', 'text', 'Value 3 Title', 'about'),
  ('value_3_body',  'We welcome men, women, youth, and families from all backgrounds into our programs.', 'textarea', 'Value 3 Body', 'about'),
  ('value_4_title', 'Integrity',   'text', 'Value 4 Title', 'about'),
  ('value_4_body',  'Fair play, transparency, and respect define everything we do on and off the field.', 'textarea', 'Value 4 Body', 'about'),

  -- Contact info
  ('contact_address',   'Northern Virginia, Washington D.C. Metro Area, USA', 'text', 'Office Address', 'contact'),
  ('contact_email',     'agdcvakbl@gmail.com', 'text', 'Contact Email',     'contact'),
  ('contact_phone',     '',                    'text', 'Contact Phone',     'contact'),
  ('contact_facebook',  'https://facebook.com/afghansportsfederation', 'url', 'Facebook URL', 'contact'),
  ('contact_instagram', '', 'url', 'Instagram URL', 'contact'),
  ('contact_twitter',   '', 'url', 'Twitter/X URL', 'contact'),
  ('contact_youtube',   '', 'url', 'YouTube URL',   'contact'),

  -- Footer
  ('footer_description', 'Building Afghan sports communities worldwide since 1998. Join us in creating a legacy that connects Afghans across the globe through the power of sport.', 'textarea', 'Footer Description', 'footer'),
  ('footer_copyright',   '2026 Afghan Sports Federation. All rights reserved.', 'text', 'Footer Copyright', 'footer'),

  -- Newsletter
  ('newsletter_title',    'Stay Connected with Afghan Sports', 'text', 'Newsletter Title', 'newsletter'),
  ('newsletter_subtitle', 'Get updates on events, match results, and community news delivered to your inbox.', 'text', 'Newsletter Subtitle', 'newsletter'),

  -- Legal placeholders
  ('privacy_last_updated', 'January 1, 2026', 'text', 'Privacy Policy Last Updated', 'legal'),
  ('terms_last_updated',   'January 1, 2026', 'text', 'Terms Last Updated',          'legal')
on conflict (content_key) do nothing;


-- =============================================================================
-- SITE SETTINGS
-- =============================================================================
insert into public.site_settings (setting_key, setting_value, setting_type, label, group_name) values
  ('site_name',                    'Afghan Sports Federation', 'text',    'Site Name',                     'general'),
  ('site_tagline',                 'Building community through sports excellence since 1998', 'text', 'Site Tagline', 'general'),
  ('site_language',                'en',    'text',    'Default Language',         'general'),
  ('maintenance_mode',             'false', 'boolean', 'Maintenance Mode',         'general'),
  ('registration_enabled',         'true',  'boolean', 'User Registration Enabled','general'),
  ('team_creation_enabled',        'true',  'boolean', 'Team Creation Enabled',    'general'),
  ('event_submissions_enabled',    'true',  'boolean', 'Event Submissions Enabled','general'),
  ('afghan_cup_date',              '2026-07-02', 'date',    'Afghan Cup Date',         'afghancup'),
  ('afghan_cup_location',          'Springfield, Virginia',    'text',    'Afghan Cup Location',     'afghancup'),
  ('afghan_cup_registration_open', 'true',  'boolean', 'Cup Registration Open',    'afghancup'),
  ('resend_api_configured',        'false', 'boolean', 'Email Configured',         'email'),
  ('google_oauth_enabled',         'false', 'boolean', 'Google OAuth Enabled',     'auth')
on conflict (setting_key) do nothing;


-- =============================================================================
-- MANAGEMENT TEAM
-- =============================================================================
insert into public.management_team (name, role, bio, photo_url, category, sort_order) values
  ('Ahmad Karimi',  'President',                    'Ahmad has led the Afghan Sports Federation since 2018. A former competitive soccer player, he brings 20 years of community organizing experience and a deep passion for Afghan culture and sport. Ahmad works tirelessly to grow ASF programs across the United States.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad',  'board',     1),
  ('Khalid Noorzai','Vice President',               'Khalid oversees ASF operations and strategic partnerships. He has been instrumental in expanding the Afghan Cup tournament to include international teams. Khalid holds an MBA from George Mason University and has a background in nonprofit management.',           'https://api.dicebear.com/7.x/avataaars/svg?seed=khalid', 'board',     2),
  ('Mariam Sultani','Secretary General',            'Mariam manages all administrative functions of ASF and coordinates communications across chapters. She joined ASF in 2015 and has been pivotal in digitizing the organization records and building the women sports programs.',                                     'https://api.dicebear.com/7.x/avataaars/svg?seed=mariam', 'board',     3),
  ('Nasir Rahimi',  'Treasurer',                    'Nasir oversees the financial management of ASF. A certified accountant, he ensures full transparency and accountability in how ASF funds are managed. He has helped secure over 200,000 dollars in grants and sponsorships for ASF programs.',                    'https://api.dicebear.com/7.x/avataaars/svg?seed=nasir',  'board',     4),
  ('Laila Ahmadi',  'Director of Women Programs',   'Laila founded the ASF women soccer and volleyball programs in 2019. Her work has brought hundreds of Afghan women into organized sports who previously had no access to athletic programs. She is a certified youth sports coach.',                            'https://api.dicebear.com/7.x/avataaars/svg?seed=laila',  'board',     5),
  ('Omar Hakimi',   'Director of Youth Programs',   'Omar runs ASF youth development initiatives across Northern Virginia. He coordinates with schools, community centers, and mosques to deliver sports programs to Afghan youth aged 8 to 18. Former Afghan national youth soccer team member.',                  'https://api.dicebear.com/7.x/avataaars/svg?seed=omar',   'board',     6),
  ('Fatima Yousefi','Community Liaison',            'Fatima connects ASF with Afghan communities in new cities and states. She has helped establish affiliate teams in Texas, California, and New York. She speaks Dari, Pashto, and English fluently.',                                                            'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima', 'volunteers',7),
  ('Zarghoon Wali', 'Event Coordinator',            'Zarghoon coordinates all ASF events including the Afghan Cup. He has produced 12 Afghan Cup tournaments and manages relationships with venues, referees, and vendors across the East Coast.',                                                                  'https://api.dicebear.com/7.x/avataaars/svg?seed=zarghoon','volunteers',8)
on conflict do nothing;


-- =============================================================================
-- HISTORY TIMELINE
-- =============================================================================
insert into public.history_timeline (year, title, description, sort_order) values
  (1998, 'ASF Founded',                      'Afghan Sports Federation established in Washington D.C. metropolitan area by a group of Afghan American community leaders passionate about keeping Afghan culture alive through sport.', 1),
  (1999, 'First Afghan Cup',                 'The inaugural Afghan Cup soccer tournament was held with 6 teams competing. The tournament drew 200 spectators and became the foundation for what would grow into the largest Afghan sports event in North America.', 2),
  (2003, 'Basketball Program Launched',      'ASF expanded beyond soccer to launch its basketball program, attracting a new generation of young Afghan Americans to the federation.', 3),
  (2008, 'Afghan Cup Reaches 500 Spectators','The 10th Afghan Cup attracted over 500 spectators and 16 competing teams, marking a turning point in the federation growth and public profile.', 4),
  (2012, 'Volleyball and Bowling Added',     'ASF added volleyball and bowling programs, bringing the total to four organized sports under the federation umbrella.', 5),
  (2015, '1000+ Community Members',          'ASF membership surpassed 1,000 registered community members across its programs, events, and volunteer network.', 6),
  (2018, 'Table Tennis Program Launched',    'The fifth and final sport of the current ASF portfolio was added, completing the federation multi-sport vision.', 7),
  (2021, 'New Community Wave',               'Following the events in Afghanistan, thousands of new Afghan arrivals joined the American Afghan community. ASF opened its doors wide, providing not just sports but a sense of home and belonging to newly arrived families.', 8),
  (2024, 'Digital Transformation Begins',    'ASF committed to building a proper digital platform to connect Afghan sports communities worldwide, not just in Northern Virginia.', 9),
  (2026, 'Global Platform Launch',           'The ASF Global Platform launches, connecting Afghan sports communities across 40+ countries. The 28th Afghan Cup is held entirely through the new digital platform.', 10)
on conflict do nothing;


-- =============================================================================
-- FAQ ITEMS  (21 entries across 6 categories)
-- =============================================================================
insert into public.faq_items (question, answer, category, sort_order) values
  ('What is the Afghan Sports Federation?',          'The Afghan Sports Federation (ASF) is a non-profit organization founded in 1998 in the Washington D.C. metropolitan area. We organize amateur sports programs, tournaments, and community events for Afghan Americans and Afghans worldwide. Our flagship event is the Afghan Cup, which has been running for over 26 years.', 'general', 1),
  ('Who can join ASF?',                              'Anyone is welcome to join ASF. You do not need to be Afghan to participate in our programs or join our community. We welcome athletes, families, and sports fans from all backgrounds who share a love of sport and an interest in Afghan culture.', 'general', 2),
  ('Is it free to join?',                            'Creating an account on the ASF platform is completely free. Individual membership costs nothing. Some team registrations and tournament entries may have small fees to cover event costs. The Afghan Cup has a team registration fee that is announced each year.', 'general', 3),
  ('Where is ASF based?',                            'ASF is headquartered in Northern Virginia in the Washington D.C. metropolitan area. We have community teams and affiliate groups in Texas, California, New York, and other states. We are actively expanding internationally.', 'general', 4),
  ('How do I create an account?',                    'Click the Join button at the top of any page. Enter your full name, email address, and a password. Verify your email, then follow the short onboarding steps to set your location and sport preferences. The whole process takes about 2 minutes.', 'registration', 5),
  ('How do I become a player on the platform?',      'After creating your account, go to Settings and click the Player Settings tab. Toggle on I am a player, select your sport and position, and save. Your profile will now show a Player badge and you can appear on the Free Agent board for teams to find you.', 'registration', 6),
  ('How do I reset my password?',                    'Click Login then Forgot password. Enter your email address and we will send you a password reset link. Check your inbox (and spam folder if needed). The reset link is valid for 1 hour.', 'registration', 7),
  ('How do I create a team?',                        'Log in to your account and click Create Team from your dashboard. Give your team a name, pick your sport, choose your city and state, and optionally upload a team logo. You become the team captain automatically. Add players by searching for their usernames.', 'teams', 8),
  ('How do I join an existing team?',                'Browse the Teams directory and find a team in your area. If they are looking for players, click Request to Join. The team captain will be notified and can accept or decline. You can also turn on Looking for a Team in your player settings and wait for captains to contact you.', 'teams', 9),
  ('What is an ASF Affiliate team?',                 'ASF Affiliate teams are officially recognized by the federation. They carry the ASF badge on their profile and are eligible to compete in the Afghan Cup and official tournaments. To become an affiliate, a community team must have 15+ registered players, a track record of activity, and approval from ASF management.', 'teams', 10),
  ('How do I find players for my team?',             'Use the Free Agent Board under the Teams section. Filter by your city, state, and sport to see players who are actively looking for a team. You can message them directly through the platform. You can also post in the USA Discussion Board to attract interest.', 'teams', 11),
  ('How do I post an event?',                        'Log in and click Post Event from your dashboard. Fill in the event details (title, sport, date, location, description). Your event is submitted for review and will be published within 24 hours once approved by the ASF team.', 'events', 12),
  ('Are all events free?',                           'Events can be free or paid. Each event listing shows whether it is free or has an entry fee. Recreational and community events are typically free. Tournaments may have registration fees. Check individual event pages for details.', 'events', 13),
  ('How do I register for an event?',                'Open the event page and click the registration link or contact button. Some events require you to register through an external link. For ASF organized tournaments, team captains register through the platform dashboard.', 'events', 14),
  ('What is the Afghan Cup?',                        'The Afghan Cup is ASF flagship annual soccer tournament, now in its 28th edition. It is the largest Afghan American sports event in North America, attracting teams from across the United States. The Afghan Cup is open to ASF Affiliate teams and is the pinnacle of achievement in the ASF soccer program.', 'afghancup', 15),
  ('When is the next Afghan Cup?',                   'Afghan Cup 2026 is scheduled for July 2026 in Northern Virginia. Registration opens April 1, 2026 and closes June 15, 2026. Check the Events page for the most current details and the countdown timer on our homepage.', 'afghancup', 16),
  ('How do I register my team for the Afghan Cup?', 'Your team must be an official ASF Affiliate first. Once registered as an affiliate, the team captain will see a Register for Afghan Cup button in their team management dashboard when registration opens. You must have a minimum of 15 players on your roster.', 'afghancup', 17),
  ('Where is the Afghan Cup held?',                  'The Afghan Cup is traditionally held in the Northern Virginia and Washington D.C. metro area. The exact venue is announced each year when registration opens. Past venues include local sports complexes and university facilities across Northern Virginia.', 'afghancup', 18),
  ('How can I volunteer with ASF?',                  'We welcome volunteers for events, administration, coaching, refereeing, and community outreach. Contact us through the Contact page with your name, availability, and what you would like to help with. We will be in touch within a week.', 'volunteering', 19),
  ('How can I sponsor ASF?',                         'Businesses and individuals can sponsor ASF events and programs. Sponsorship packages range from community level to tournament title sponsor. Contact us through the Sponsorship subject on our Contact page and we will send you our sponsorship deck.', 'volunteering', 20),
  ('How can I contact the board?',                   'Use the Contact page on the website. Select the appropriate subject (General Inquiry, Afghan Cup, Volunteer, Sponsorship, etc.) and your message will be directed to the right person on the board. We aim to respond within 48 hours.', 'volunteering', 21)
on conflict do nothing;


-- =============================================================================
-- GALLERY IMAGES  (Unsplash sample photos; 12 rows)
--   Augments the placeholder rows already inserted by migration 003.
-- =============================================================================
insert into public.gallery_images (image_url, caption, event_name, year, sort_order) values
  ('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', 'Afghan Cup 2025 championship match at Springfield Soccer Complex', 'Afghan Cup 2025',          2025, 101),
  ('https://images.unsplash.com/photo-1431324155629-1a6dae1434d5?w=800', 'Opening ceremony of the 27th Afghan Cup tournament',               'Afghan Cup 2025',          2025, 102),
  ('https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800', 'Youth basketball clinic organized by ASF in Northern Virginia',     'Youth Programs 2025',      2025, 103),
  ('https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', 'ASF Basketball League championship game',                            'Basketball League 2024',   2024, 104),
  ('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'Volleyball tournament finals, summer 2024',                          'Volleyball Tournament 2024', 2024, 105),
  ('https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800', 'Afghan Cup 2024 team photos before the semifinals',                 'Afghan Cup 2024',          2024, 106),
  ('https://images.unsplash.com/photo-1540747913346-19212a4b84e6?w=800', 'Table tennis championship at the ASF community center',             'Table Tennis Open 2024',   2024, 107),
  ('https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', 'Women soccer program launch, May 2023',                              'Women Programs 2023',      2023, 108),
  ('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800', 'Community day at Reston, families and friends of ASF',               'Community Day 2023',       2023, 109),
  ('https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800', 'Afghan Cup 2023 winning team celebrating on the field',             'Afghan Cup 2023',          2023, 110),
  ('https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800', 'Bowling league night at ASF partner venue, Falls Church',           'Bowling League 2023',      2023, 111),
  ('https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', 'Youth soccer training session, Northern Virginia 2022',              'Youth Programs 2022',      2022, 112)
on conflict do nothing;


-- =============================================================================
-- NEWS POSTS  (4 sample articles)
-- =============================================================================
insert into public.news_posts (title, slug, content, excerpt, image_url, is_published, published_at) values
  ('Afghan Cup 2026 Registration Now Open',
   'afghan-cup-2026-registration-open',
   E'<p>We are thrilled to announce that registration for the 28th Afghan Cup is now officially open. This year tournament will be held in Northern Virginia on July 2, 2026, continuing a proud tradition that spans more than a quarter century.</p>\n<p>Teams wishing to participate must be registered as official ASF Affiliates on the platform. Registration closes June 15, 2026. Eligible teams must have a minimum of 15 active players on their roster at the time of registration.</p>\n<p>The Afghan Cup remains the largest Afghan American sports event in North America and a celebration of our community love of sport. We look forward to another unforgettable tournament and invite all eligible teams to register as soon as possible as spots are limited.</p>\n<p>For eligibility requirements and registration details, visit your team dashboard or contact us through the website.</p>',
   'Registration for the 28th Afghan Cup is officially open. The tournament takes place July 2, 2026 in Northern Virginia. Spots are limited.',
   'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200',
   true, now() - interval '2 days'),

  ('ASF Launches New Women Volleyball Program in Virginia',
   'womens-volleyball-program-launch',
   E'<p>The Afghan Sports Federation is proud to announce the launch of our new Women Volleyball Program, serving the Northern Virginia and Washington D.C. metropolitan area. This program is open to Afghan and non-Afghan women aged 16 and older of all skill levels.</p>\n<p>Training sessions will be held every Thursday evening at the ASF partner facility in Reston, Virginia. No prior volleyball experience is required. The program will culminate in a summer tournament open to all registered teams.</p>\n<p>This program is part of ASF ongoing commitment to expanding athletic opportunities for Afghan women in our community. Our Director of Women Programs, Laila Ahmadi, will lead the program with a team of certified coaches.</p>\n<p>Registration is free. Sign up through the Events page or contact us directly.</p>',
   'ASF launches a new Women Volleyball Program in Northern Virginia. Open to all skill levels, starting this spring.',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
   true, now() - interval '5 days'),

  ('ASF Platform Goes Live: Connect with Afghan Sports Worldwide',
   'asf-platform-launch',
   E'<p>After months of development, we are excited to announce the launch of the new ASF digital platform at afghansportsfederation.com. This platform represents a major milestone in ASF 26-year history and our vision for the global Afghan sports community.</p>\n<p>The platform allows teams to create official profiles, post match results, find players through the Free Agent board, and connect with the broader Afghan sports community worldwide. Community members can register, follow their favorite teams, and stay updated on events and news.</p>\n<p>This is just the beginning. In the coming months we will be adding more features including community discussion boards, match result submissions, direct messaging, and world map of teams. Our goal is to become the home of Afghan sports worldwide, from Kabul to California.</p>\n<p>We invite every Afghan sports team in the world to register on the platform and claim their space in the global Afghan sports community.</p>',
   'The new ASF digital platform is live. Register your team, find players, and connect with Afghan sports communities worldwide.',
   'https://images.unsplash.com/photo-1431324155629-1a6dae1434d5?w=1200',
   true, now() - interval '10 days'),

  ('ASF Youth Basketball Program Expanding to Maryland',
   'youth-basketball-maryland',
   E'<p>Following the success of our Northern Virginia youth basketball program, ASF is expanding into Maryland with a new program serving the Bethesda and Silver Spring areas. The program targets youth aged 10 to 18 and will operate in partnership with local community centers.</p>\n<p>Omar Hakimi, ASF Director of Youth Programs, will oversee the new program. We have seen incredible demand from families in Maryland who want their children to play sports in a community that understands their culture and values, said Omar. This expansion is a natural next step for us.</p>\n<p>Registration opens for the Maryland program on March 1, 2026. Practices will be held on Saturdays. All participants will receive ASF jerseys and equipment at no cost thanks to our generous sponsors.</p>',
   'ASF expands its youth basketball program into Maryland, serving the Bethesda and Silver Spring communities starting spring 2026.',
   'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200',
   true, now() - interval '15 days')
on conflict (slug) do nothing;


-- =============================================================================
-- SPONSORS  (7 placeholder sponsors with placehold.co logos)
-- =============================================================================
insert into public.sponsors (name, logo_url, website_url, tier, sort_order) values
  ('Karimi Real Estate Group',           'https://placehold.co/240x120/223852/ffffff?text=Karimi+Realty',     'https://example.com', 'platinum', 1),
  ('Afghan American Chamber of Commerce','https://placehold.co/240x120/C8281E/ffffff?text=AACC',              'https://example.com', 'gold',     2),
  ('Noorzai Law Firm',                   'https://placehold.co/240x120/223852/ffffff?text=Noorzai+Law',       'https://example.com', 'gold',     3),
  ('Kabul Restaurant Group',             'https://placehold.co/240x120/C8A84B/ffffff?text=Kabul+Restaurants', 'https://example.com', 'silver',   4),
  ('Afghan Medical Association USA',     'https://placehold.co/240x120/009A44/ffffff?text=AMA+USA',           'https://example.com', 'silver',   5),
  ('Helmand Valley Construction',        'https://placehold.co/240x120/6B7280/ffffff?text=HVC',               'https://example.com', 'partner',  6),
  ('Afghan Cultural Center',             'https://placehold.co/240x120/223852/ffffff?text=ACC',               'https://example.com', 'partner',  7)
on conflict do nothing;


-- =============================================================================
-- ADDITIONAL EVENTS  (Afghan Cup 2026 already seeded by migration 003)
-- =============================================================================
-- Decision: insert with explicit slugs and ON CONFLICT DO NOTHING. Maps the
-- prompt's `image_url` and `venue` columns onto existing `banner_url` and
-- `venue_name` so existing pages keep working.
-- =============================================================================
insert into public.events (
  title, slug, event_type, sport, description, banner_url,
  country_code, state_province, city, venue_name, address,
  start_datetime, end_datetime, is_free, is_featured, is_published
) values
  ('ASF Spring Soccer League',
   'asf-spring-soccer-league-2026',
   'tournament', 'soccer',
   'The ASF Spring Soccer League runs every Saturday from April through June. Teams play a round-robin format with the top four teams advancing to a playoff weekend. All community teams are welcome, no affiliate status required. Register your team of at least 10 players to participate.',
   'https://images.unsplash.com/photo-1431324155629-1a6dae1434d5?w=1200',
   'US', 'VA', 'Arlington', 'Bluemont Park Soccer Fields', '601 N Manchester St, Arlington, VA 22203',
   '2026-04-05T09:00:00Z', '2026-04-05T18:00:00Z', false, false, true),

  ('Youth Basketball Clinic with Coach Hakimi',
   'youth-basketball-clinic-2026-03',
   'camp', 'basketball',
   'A free one-day basketball skills clinic for youth aged 10 to 18. Led by ASF Youth Director Omar Hakimi and a team of volunteer coaches. Players will work on dribbling, shooting, defense, and teamwork in a fun and supportive environment. Lunch provided. Bring your own water bottle and wear comfortable athletic clothing.',
   'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200',
   'US', 'VA', 'Reston', 'Reston Community Center', '2310 Colts Neck Rd, Reston, VA 20191',
   '2026-03-15T10:00:00Z', '2026-03-15T16:00:00Z', true, false, true),

  ('ASF Community Volleyball Open',
   'asf-community-volleyball-open-2026-05',
   'tournament', 'volleyball',
   'Open community volleyball tournament for teams of 6. No experience required. Men and women divisions. Trophy and prizes for winning teams. Free entry, open to all members of the Afghan and non-Afghan communities. Bring friends and family.',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
   'US', 'MD', 'Bethesda', 'Friendship Heights Community Center', '4433 S Park Ave, Chevy Chase, MD 20815',
   '2026-05-10T10:00:00Z', '2026-05-10T19:00:00Z', true, false, true)
on conflict (slug) do nothing;


-- =============================================================================
-- Verification queries (run these after the migration to confirm)
-- =============================================================================
-- select count(*) from public.site_content;       -- expected: ~57
-- select count(*) from public.site_settings;      -- expected: 12
-- select count(*) from public.management_team;    -- expected: 8
-- select count(*) from public.history_timeline;   -- expected: 10
-- select count(*) from public.faq_items;          -- expected: 21
-- select count(*) from public.gallery_images;     -- expected: 12 + existing placeholders
-- select count(*) from public.news_posts;         -- expected: 4
-- select count(*) from public.sponsors;           -- expected: 7
-- select count(*) from public.events where is_published = true;  -- expected: 4 (Afghan Cup + 3 new)
