-- Seed categories
INSERT INTO categories (name, slug, description, icon) VALUES
('Sve Kategorije', 'sve-kategorije', 'Prikaži sve kategorije', 'box'),
('Odeća', 'odeca', 'Odeća', 'tshirt'),
('Obuća', 'obuca', 'Obuća', 'shoe'),
('Nameštaj', 'namestaj', 'Nameštaj i domaći pribor', 'sofa'),
('Elektronika', 'elektronika', 'Elektronički uređaji', 'laptop'),
('Kućne Potrepštine', 'kucne-potrepstine', 'Kućne potrepštine i aparati', 'house'),
('Igračke', 'igracke', 'Igračke za decu', 'gift'),
('Stvari za Bebe', 'stvari-za-bebe', 'Stvari za bebe i novorođenčad', 'baby'),
('Knjige', 'knjige', 'Knjige i časopisi', 'book'),
('Predmet', 'predmet', 'Razni predmeti', 'box'),
('Ostalo', 'ostalo', 'Ostale kategorije', 'box')
ON CONFLICT (slug) DO NOTHING;

