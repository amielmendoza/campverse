-- Seed data: 10 popular camping locations mostly in Tanay, Rizal and nearby areas
-- Amenities stored as jsonb array of {name, image_url} objects
-- Gallery stored as jsonb array of image URL strings
INSERT INTO public.locations (name, slug, description, image_url, latitude, longitude, region, amenities, gallery, capacity) VALUES

(
  'Treasure Mountain',
  'treasure-mountain',
  'Perched at 600 meters in Tanay, Rizal with panoramic views of the Sierra Madre range and Laguna de Bay. Watch the sea of clouds roll in at sunrise from the famous viewdeck. A top weekend escape from Manila.',
  'https://images.unsplash.com/photo-1478827536114-da961b7f86d2',
  14.5340,
  121.4150,
  'Tanay, Rizal',
  '[
    {"name": "Camping Grounds", "image_url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400"},
    {"name": "Hiking Trails", "image_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400"},
    {"name": "Restrooms", "image_url": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400"},
    {"name": "Parking", "image_url": "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=400"},
    {"name": "Viewdeck", "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"},
    {"name": "Picnic Areas", "image_url": "https://images.unsplash.com/photo-1496885872519-101b4ee0f8fb?w=400"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=800",
    "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=800",
    "https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=800",
    "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800"]'::jsonb,
  120
),

(
  'Camp Zaragosa',
  'camp-zaragosa',
  'A well-maintained private campsite in Tanay, Rizal surrounded by lush greenery and overlooking the mountains. Features flat camping grounds, a bonfire area, and a refreshing natural swimming pool.',
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4',
  14.5120,
  121.3890,
  'Tanay, Rizal',
  '[
    {"name": "Camping Grounds", "image_url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400"},
    {"name": "Swimming Pool", "image_url": "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=400"},
    {"name": "Bonfire Area", "image_url": "https://images.unsplash.com/photo-1601920591158-7a1d2a6cfcda?w=400"},
    {"name": "Restrooms", "image_url": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400"},
    {"name": "Parking", "image_url": "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=400"},
    {"name": "Cottages", "image_url": "https://images.unsplash.com/photo-1494145904049-0dca7b0189ad?w=400"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=800",
    "https://images.unsplash.com/photo-1525811902-f2342640856e?w=800",
    "https://images.unsplash.com/photo-1563299796-17596ed6b017?w=800"]'::jsonb,
  80
),

(
  'Tanay Backyard Camping',
  'tanay-backyard',
  'A cozy hilltop campsite in Tanay offering stunning sunrise views over the valley. Known for its relaxed atmosphere, friendly hosts, and clear night skies perfect for stargazing with friends.',
  'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7',
  14.5050,
  121.3950,
  'Tanay, Rizal',
  '[
    {"name": "Camping Grounds", "image_url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400"},
    {"name": "Bonfire Area", "image_url": "https://images.unsplash.com/photo-1601920591158-7a1d2a6cfcda?w=400"},
    {"name": "Restrooms", "image_url": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400"},
    {"name": "Parking", "image_url": "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=400"},
    {"name": "Stargazing", "image_url": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400"},
    {"name": "Hammock Area", "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1532339142463-fd0a8979791a?w=800",
    "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=800",
    "https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?w=800"]'::jsonb,
  40
),

(
  'Masungi Georeserve',
  'masungi-georeserve',
  'An award-winning conservation area in Tanay featuring stunning limestone formations, hanging bridges, rope courses, and a rich biodiversity. A unique blend of adventure and environmental awareness.',
  'https://images.unsplash.com/photo-1510312305653-8ed496efae75',
  14.5570,
  121.3630,
  'Tanay, Rizal',
  '[
    {"name": "Hiking Trails", "image_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400"},
    {"name": "Rope Courses", "image_url": "https://images.unsplash.com/photo-1495621821757-a1efb6729352?w=400"},
    {"name": "Hanging Bridges", "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400"},
    {"name": "Guide Services", "image_url": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400"},
    {"name": "Restrooms", "image_url": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400"},
    {"name": "Parking", "image_url": "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=400"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1440581572325-0bea30075d9d?w=800",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
    "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800",
    "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800"]'::jsonb,
  60
),

(
  'Kaysakat Falls Campsite',
  'kaysakat-falls',
  'A hidden gem campsite near Kaysakat Falls in Tanay, Rizal. Trek through river trails and dense forest to reach a cascading waterfall with a natural pool. Camp beside the river and fall asleep to the sound of flowing water.',
  'https://images.unsplash.com/photo-1532339142463-fd0a8979791a',
  14.4980,
  121.4200,
  'Tanay, Rizal',
  '[
    {"name": "Riverside Camping", "image_url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400"},
    {"name": "Swimming", "image_url": "https://images.unsplash.com/photo-1576077345fc-5f7dcb7e94dc?w=400"},
    {"name": "Hiking Trails", "image_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400"},
    {"name": "Waterfall", "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"},
    {"name": "Fire Pits", "image_url": "https://images.unsplash.com/photo-1601920591158-7a1d2a6cfcda?w=400"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800",
    "https://images.unsplash.com/photo-1485160497022-3e09382fb310?w=800",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"]'::jsonb,
  30
),

(
  'Cloud 9 Hills Tanay',
  'cloud9-hills',
  'A scenic hilltop campsite in Tanay that lives up to its name — camp literally among the clouds. The rolling terrain and open grasslands give it a Batanes-like feel just an hour from the city.',
  'https://images.unsplash.com/photo-1487730116645-74489c95b41b',
  14.5200,
  121.4050,
  'Tanay, Rizal',
  '[
    {"name": "Camping Grounds", "image_url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400"},
    {"name": "Hiking Trails", "image_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400"},
    {"name": "Bonfire Area", "image_url": "https://images.unsplash.com/photo-1601920591158-7a1d2a6cfcda?w=400"},
    {"name": "Restrooms", "image_url": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400"},
    {"name": "Parking", "image_url": "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=400"},
    {"name": "Viewdeck", "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    "https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=800",
    "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=800",
    "https://images.unsplash.com/photo-1542202229-7d93c33f5d07?w=800"]'::jsonb,
  50
),

(
  'Daranak Falls Campground',
  'daranak-falls',
  'Camp near the iconic Daranak Falls in Tanay, one of Rizal''s most visited waterfalls. The blue-green cascade drops into a wide natural pool perfect for swimming. A great campsite for families and groups.',
  'https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce',
  14.4870,
  121.3540,
  'Tanay, Rizal',
  '[
    {"name": "Camping Grounds", "image_url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400"},
    {"name": "Swimming", "image_url": "https://images.unsplash.com/photo-1576077345fc-5f7dcb7e94dc?w=400"},
    {"name": "Waterfall", "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"},
    {"name": "Restrooms", "image_url": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400"},
    {"name": "Parking", "image_url": "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=400"},
    {"name": "Picnic Areas", "image_url": "https://images.unsplash.com/photo-1496885872519-101b4ee0f8fb?w=400"},
    {"name": "Sari-sari Store", "image_url": "https://images.unsplash.com/photo-1556767576-5ec41e3239ea?w=400"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
    "https://images.unsplash.com/photo-1563299796-17596ed6b017?w=800"]'::jsonb,
  100
),

(
  'Mt. Daraitan Summit Camp',
  'mt-daraitan',
  'One of the most rewarding hikes in Rizal at 739 meters. The trail passes through Tinipak River with its marble-white boulders before ascending to a summit with jaw-dropping views of the Sierra Madre range.',
  'https://images.unsplash.com/photo-1501554728187-ce583db33af7',
  14.5830,
  121.4480,
  'Tanay, Rizal',
  '[
    {"name": "Camping Grounds", "image_url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400"},
    {"name": "Hiking Trails", "image_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400"},
    {"name": "River Crossing", "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400"},
    {"name": "Swimming", "image_url": "https://images.unsplash.com/photo-1576077345fc-5f7dcb7e94dc?w=400"},
    {"name": "Guide Services", "image_url": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800",
    "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800",
    "https://images.unsplash.com/photo-1485160497022-3e09382fb310?w=800"]'::jsonb,
  40
),

(
  'Caraw Campsite Antipolo',
  'caraw-campsite',
  'A peaceful mountainside campsite in Antipolo, just next door to Tanay. Offers sweeping views of Metro Manila''s city lights at night and a lush mountain backdrop by day. Great for quick overnight getaways.',
  'https://images.unsplash.com/photo-1533632359083-0185df1be85d',
  14.5680,
  121.2140,
  'Antipolo, Rizal',
  '[
    {"name": "Camping Grounds", "image_url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400"},
    {"name": "Bonfire Area", "image_url": "https://images.unsplash.com/photo-1601920591158-7a1d2a6cfcda?w=400"},
    {"name": "Restrooms", "image_url": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400"},
    {"name": "Parking", "image_url": "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=400"},
    {"name": "City View", "image_url": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400"},
    {"name": "Hammock Area", "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1542202229-7d93c33f5d07?w=800",
    "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=800",
    "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=800"]'::jsonb,
  35
),

(
  'Tinipak River Camp',
  'tinipak-river',
  'Camp along the pristine Tinipak River in Tanay, known for its stunning marble-white rock formations and crystal-clear waters. A unique riverside camping experience surrounded by towering canyon walls.',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
  14.5780,
  121.4350,
  'Tanay, Rizal',
  '[
    {"name": "Riverside Camping", "image_url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400"},
    {"name": "Swimming", "image_url": "https://images.unsplash.com/photo-1576077345fc-5f7dcb7e94dc?w=400"},
    {"name": "Hiking Trails", "image_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400"},
    {"name": "Rock Formations", "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"},
    {"name": "Guide Services", "image_url": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400"},
    {"name": "Fire Pits", "image_url": "https://images.unsplash.com/photo-1601920591158-7a1d2a6cfcda?w=400"}
  ]'::jsonb,
  '["https://images.unsplash.com/photo-1485160497022-3e09382fb310?w=800",
    "https://images.unsplash.com/photo-1440581572325-0bea30075d9d?w=800",
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800",
    "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800"]'::jsonb,
  45
);
