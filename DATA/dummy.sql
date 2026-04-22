SET search_path TO movie_db;

-- =========================
-- 1. MASTER TABLES INSERSION
-- =========================

-- Production Houses
INSERT INTO PRODUCTION_HOUSE (production_id, name, founder, established_year, headquarter_city) VALUES
(1, 'Aamir Khan Productions', 'Aamir Khan', 1999, 'Mumbai'),
(2, 'Yash Raj Films', 'Yash Chopra', 1970, 'Mumbai'),
(3, 'Red Chillies Entertainment', 'Shah Rukh Khan', 2002, 'Mumbai'),
(4, 'Salman Khan Films', 'Salman Khan', 2011, 'Mumbai'),
(5, 'Excel Entertainment', 'Farhan Akhtar', 1999, 'Mumbai'),
(6, 'Viacom18 Studios', 'Ajit Andhare', 2008, 'Mumbai'),
(7, 'UTV Motion Pictures', 'Ronnie Screwvala', 1996, 'Mumbai'),
(8, 'Benaras Media Works', 'Anubhav Sinha', 2012, 'Mumbai'),
(9, 'T-Series', 'Gulshan Kumar', 1983, 'New Delhi'),
(10, 'Eros International', 'Arjan Lulla', 1977, 'Mumbai'),
(11, 'Dharma Productions', 'Yash Johar', 1979, 'Mumbai'),
(12, 'Filmkraft Productions', 'Rakesh Roshan', 1977, 'Mumbai'),
(13, 'Rohit Shetty Picturez', 'Rohit Shetty', 2016, 'Mumbai');

-- Franchises
INSERT INTO FRANCHISE (franchise_id, franchise_name, cumulative_box_office, total_installments) VALUES
(1, 'YRF Spy Universe', 3000000000.00, 4),
(2, 'Aashiqui', 150000000.00, 2),
(3, 'Dhoom', 800000000.00, 3),
(4, 'Krrish', 600000000.00, 3),
(5, 'Golmaal', 1000000000.00, 4);

-- Roles
INSERT INTO ROLE (role_id, role_name) VALUES
(1, 'Director'),
(2, 'Producer'),
(3, 'Lead Actor'),
(4, 'Lead Actress'),
(5, 'Supporting Actor'),
(6, 'Music Director');

-- Persons (Actors & Directors)
INSERT INTO PERSON (person_id, full_name, gender, nationality, debut_year, birth_date) VALUES
(1, 'Aamir Khan', 'Male', 'Indian', 1984, '1965-03-14'),
(2, 'Nitesh Tiwari', 'Male', 'Indian', 2011, '1973-05-22'),
(3, 'Shah Rukh Khan', 'Male', 'Indian', 1992, '1965-11-02'),
(4, 'Deepika Padukone', 'Female', 'Indian', 2006, '1986-01-05'),
(5, 'Siddharth Anand', 'Male', 'Indian', 2005, '1978-07-31'),
(6, 'Nayanthara', 'Female', 'Indian', 2003, '1984-11-18'),
(7, 'Atlee', 'Male', 'Indian', 2013, '1986-09-21'),
(8, 'Salman Khan', 'Male', 'Indian', 1988, '1965-12-27'),
(9, 'Kabir Khan', 'Male', 'Indian', 2006, '1968-09-14'),
(10, 'Ranveer Singh', 'Male', 'Indian', 2010, '1985-07-06'),
(11, 'Zoya Akhtar', 'Female', 'Indian', 2009, '1972-10-14'),
(12, 'Ayushmann Khurrana', 'Male', 'Indian', 2012, '1984-09-14'),
(13, 'Sriram Raghavan', 'Male', 'Indian', 2004, '1959-06-22'),
(14, 'Ranbir Kapoor', 'Male', 'Indian', 2007, '1982-09-28'),
(15, 'Anurag Basu', 'Male', 'Indian', 2003, '1974-05-08'),
(16, 'Aditya Roy Kapur', 'Male', 'Indian', 2009, '1985-11-16'),
(17, 'Shraddha Kapoor', 'Female', 'Indian', 2010, '1987-03-03'),
(18, 'Imtiaz Ali', 'Male', 'Indian', 2005, '1971-06-16'),
(19, 'Shahid Kapoor', 'Male', 'Indian', 2003, '1981-02-25'),
(20, 'Kiara Advani', 'Female', 'Indian', 2014, '1992-07-31'),
(21, 'Sandeep Reddy Vanga', 'Male', 'Indian', 2017, '1981-12-25'),
(22, 'Ayan Mukerji', 'Male', 'Indian', 2009, '1983-08-15'),
(23, 'Hrithik Roshan', 'Male', 'Indian', 2000, '1974-01-10'),
(24, 'Rakesh Roshan', 'Male', 'Indian', 1970, '1949-09-06'),
(25, 'Ajay Devgn', 'Male', 'Indian', 1991, '1969-04-02'),
(26, 'Rohit Shetty', 'Male', 'Indian', 2003, '1974-03-14');

-- Music Labels
INSERT INTO MUSIC_LABEL (label_id, label_name, parent_company) VALUES
(1, 'T-Series', 'Super Cassettes Industries'),
(2, 'Zee Music Company', 'Zee Entertainment'),
(3, 'YRF Music', 'Yash Raj Films'),
(4, 'Sony Music India', 'Sony Corporation');

-- Censor Board
INSERT INTO CENSOR_BOARD (censor_id, country, authority_name) VALUES
(1, 'India', 'Central Board of Film Certification (CBFC)');

-- =========================
-- 2. CORE TABLE (MOVIES)
-- =========================
-- 1: Dangal, 2: Pathaan, 3: Jawan, 4: Bajrangi Bhaijaan, 5: Gully Boy, 
-- 6: Andhadhun, 7: Barfi!, 8: Article 15, 9: Aashiqui 2, 10: Rockstar, 
-- 11: Kabir Singh, 12: YJHD, 13: Dhoom 2, 14: Krrish 3, 15: Golmaal Again

INSERT INTO MOVIE (movie_id, title, age_rating, runtime_minutes, release_date, release_status, budget, production_id, franchise_id) VALUES
(1, 'Dangal', 'U', 161, '2016-12-23', 'Released', 70000000.00, 1, NULL),
(2, 'Pathaan', 'UA', 146, '2023-01-25', 'Released', 225000000.00, 2, 1),
(3, 'Jawan', 'UA', 169, '2023-09-07', 'Released', 300000000.00, 3, NULL),
(4, 'Bajrangi Bhaijaan', 'U', 159, '2015-07-17', 'Released', 90000000.00, 4, NULL),
(5, 'Gully Boy', 'UA', 154, '2019-02-14', 'Released', 84000000.00, 5, NULL),
(6, 'Andhadhun', 'UA', 139, '2018-10-05', 'Released', 32000000.00, 6, NULL),
(7, 'Barfi!', 'U', 151, '2012-09-14', 'Released', 40000000.00, 7, NULL),
(8, 'Article 15', 'UA', 130, '2019-06-28', 'Released', 30000000.00, 8, NULL),
(9, 'Aashiqui 2', 'U', 132, '2013-04-26', 'Released', 18000000.00, 9, 2),
(10, 'Rockstar', 'UA', 159, '2011-11-11', 'Released', 60000000.00, 10, NULL),
(11, 'Kabir Singh', 'A', 172, '2019-06-21', 'Released', 60000000.00, 9, NULL),
(12, 'Yeh Jawaani Hai Deewani', 'U', 160, '2013-05-31', 'Released', 40000000.00, 11, NULL),
(13, 'Dhoom 2', 'UA', 152, '2006-11-24', 'Released', 35000000.00, 2, 3),
(14, 'Krrish 3', 'U', 152, '2013-11-01', 'Released', 115000000.00, 12, 4),
(15, 'Golmaal Again', 'UA', 140, '2017-10-20', 'Released', 100000000.00, 13, 5);


-- =========================
-- 3. RELATION TABLES
-- =========================

-- Cast & Crew Linking (movie_id, person_id, role_id)
INSERT INTO CAST_CREW (movie_id, person_id, role_id) VALUES
-- Dangal
(1, 1, 3), (1, 2, 1),
-- Pathaan
(2, 3, 3), (2, 4, 4), (2, 5, 1),
-- Jawan
(3, 3, 3), (3, 6, 4), (3, 7, 1),
-- Bajrangi Bhaijaan
(4, 8, 3), (4, 9, 1),
-- Gully Boy
(5, 10, 3), (5, 11, 1),
-- Andhadhun
(6, 12, 3), (6, 13, 1),
-- Barfi!
(7, 14, 3), (7, 15, 1),
-- Article 15
(8, 12, 3),
-- Aashiqui 2
(9, 16, 3), (9, 17, 4),
-- Rockstar
(10, 14, 3), (10, 18, 1),
-- Kabir Singh
(11, 19, 3), (11, 20, 4), (11, 21, 1),
-- YJHD
(12, 14, 3), (12, 4, 4), (12, 22, 1),
-- Dhoom 2
(13, 23, 3),
-- Krrish 3
(14, 23, 3), (14, 24, 1),
-- Golmaal Again
(15, 25, 3), (15, 26, 1);

-- GENRES (Using your exact schema setup)
INSERT INTO GENRE (genre_name, is_primary, weight, movie_id) VALUES
('Biography', TRUE, 9.5, 1), ('Sports', FALSE, 8.0, 1),
('Action', TRUE, 9.0, 2), ('Thriller', FALSE, 7.5, 2),
('Action', TRUE, 9.0, 3), ('Drama', FALSE, 6.5, 3),
('Drama', TRUE, 8.5, 4), ('Family', FALSE, 7.0, 4),
('Musical', TRUE, 9.0, 5), ('Drama', FALSE, 8.5, 5),
('Thriller', TRUE, 9.5, 6), ('Crime', FALSE, 8.0, 6),
('Romance', TRUE, 8.5, 7), ('Comedy', FALSE, 7.5, 7),
('Crime', TRUE, 9.0, 8), ('Thriller', FALSE, 8.0, 8),
('Romance', TRUE, 9.5, 9), ('Musical', FALSE, 9.0, 9),
('Musical', TRUE, 9.0, 10), ('Romance', FALSE, 8.0, 10),
('Romance', TRUE, 8.5, 11), ('Drama', FALSE, 7.5, 11),
('Romance', TRUE, 8.5, 12), ('Comedy', FALSE, 8.0, 12),
('Action', TRUE, 9.0, 13), ('Heist', FALSE, 8.5, 13),
('Sci-Fi', TRUE, 8.5, 14), ('Superhero', FALSE, 9.0, 14),
('Comedy', TRUE, 9.0, 15), ('Horror', FALSE, 7.5, 15);

-- BOX OFFICE (Fictionalized approximate INR collections for schema population)
INSERT INTO BOX_OFFICE (movie_id, opening_day_collection, net_collection, gross_collection, total_collection, satellite_collection, ott_collection, overseas_collection) VALUES
(1, 29000000.00, 387000000.00, 538000000.00, 2000000000.00, 100000000.00, 150000000.00, 1400000000.00),
(2, 57000000.00, 543000000.00, 654000000.00, 1050000000.00, 80000000.00, 120000000.00, 396000000.00),
(3, 75000000.00, 640000000.00, 760000000.00, 1140000000.00, 90000000.00, 250000000.00, 380000000.00),
(4, 27000000.00, 320000000.00, 430000000.00, 920000000.00, 70000000.00, 50000000.00, 490000000.00),
(5, 19000000.00, 140000000.00, 165000000.00, 238000000.00, 40000000.00, 60000000.00, 73000000.00),
(6, 7000000.00, 74000000.00, 95000000.00, 456000000.00, 20000000.00, 80000000.00, 361000000.00),
(7, 8000000.00, 112000000.00, 150000000.00, 175000000.00, 25000000.00, 10000000.00, 25000000.00),
(8, 5000000.00, 65000000.00, 80000000.00, 93000000.00, 15000000.00, 20000000.00, 13000000.00),
(9, 6000000.00, 78000000.00, 105000000.00, 109000000.00, 20000000.00, 5000000.00, 4000000.00),
(10, 10000000.00, 67000000.00, 90000000.00, 108000000.00, 18000000.00, 10000000.00, 18000000.00),
(11, 20000000.00, 278000000.00, 330000000.00, 379000000.00, 35000000.00, 60000000.00, 49000000.00),
(12, 19000000.00, 188000000.00, 250000000.00, 319000000.00, 40000000.00, 15000000.00, 69000000.00),
(13, 6000000.00, 81000000.00, 110000000.00, 150000000.00, 30000000.00, 5000000.00, 40000000.00),
(14, 25000000.00, 244000000.00, 320000000.00, 393000000.00, 45000000.00, 15000000.00, 73000000.00),
(15, 30000000.00, 205000000.00, 260000000.00, 311000000.00, 50000000.00, 30000000.00, 51000000.00);

-- CENSOR CERTIFICATES (Linking to India CBFC ID 1)
INSERT INTO CENSOR_CERTIFICATE (movie_id, censor_id, issue_date, cuts_ordered, certificate_type) VALUES
(1, 1, '2016-12-15', 0, 'U'),
(2, 1, '2023-01-10', 2, 'UA'),
(3, 1, '2023-08-25', 1, 'UA'),
(4, 1, '2015-07-10', 0, 'U'),
(5, 1, '2019-02-05', 3, 'UA'),
(6, 1, '2018-09-28', 1, 'UA'),
(7, 1, '2012-09-01', 0, 'U'),
(8, 1, '2019-06-20', 4, 'UA'),
(9, 1, '2013-04-15', 0, 'U'),
(10, 1, '2011-10-30', 2, 'UA'),
(11, 1, '2019-06-10', 0, 'A'),
(12, 1, '2013-05-20', 0, 'U'),
(13, 1, '2006-11-15', 0, 'UA'),
(14, 1, '2013-10-20', 0, 'U'),
(15, 1, '2017-10-10', 0, 'UA');

-- REVIEWS
INSERT INTO REVIEW (movie_id, published_on, rating, review_type, sentiment) VALUES
(1, '2016-12-24', 9.5, 'Critic', 'Positive'),
(2, '2023-01-26', 7.5, 'Audience', 'Positive'),
(3, '2023-09-08', 8.5, 'Audience', 'Positive'),
(4, '2015-07-18', 8.8, 'Critic', 'Positive'),
(5, '2019-02-15', 9.0, 'Critic', 'Positive'),
(6, '2018-10-06', 9.8, 'Critic', 'Positive'),
(7, '2012-09-15', 8.9, 'Audience', 'Positive'),
(8, '2019-06-29', 9.2, 'Critic', 'Positive'),
(9, '2013-04-27', 7.0, 'Critic', 'Mixed'),
(10, '2011-11-12', 8.5, 'Audience', 'Positive'),
(11, '2019-06-22', 7.5, 'Critic', 'Mixed'),
(12, '2013-06-01', 8.0, 'Audience', 'Positive'),
(13, '2006-11-25', 7.8, 'Audience', 'Positive'),
(14, '2013-11-02', 6.5, 'Critic', 'Mixed'),
(15, '2017-10-21', 6.8, 'Audience', 'Mixed');


SET sear

-- =========================
-- 1. MUSIC SYSTEM (ALBUMS & SONGS)
-- =========================

-- We will insert albums for Aashiqui 2, Rockstar, and Dangal
INSERT INTO ALBUM (album_id, album_title, release_date, movie_id, label_id) VALUES
(1, 'Dangal (Original Motion Picture Soundtrack)', '2016-12-14', 1, 2), -- Zee Music
(2, 'Aashiqui 2 (Original Motion Picture Soundtrack)', '2013-04-04', 9, 1), -- T-Series
(3, 'Rockstar (Original Motion Picture Soundtrack)', '2011-09-30', 10, 1); -- T-Series

INSERT INTO SONG (song_id, isrc_code, title, track_number, language, duration_seconds, album_id) VALUES
(1, 'INZ031600001', 'Haanikaarak Bapu', 1, 'Hindi', 262, 1),
(2, 'INZ031600002', 'Dhaakad', 2, 'Hindi', 178, 1),
(3, 'INT101300001', 'Tum Hi Ho', 1, 'Hindi', 262, 2),
(4, 'INT101300002', 'Sunn Raha Hai', 2, 'Hindi', 390, 2),
(5, 'INT101100001', 'Kun Faya Kun', 1, 'Hindi', 473, 3),
(6, 'INT101100002', 'Sadda Haq', 2, 'Hindi', 360, 3);

-- =========================
-- 2. LEGAL & CONTRACTS
-- =========================

-- Contract ID, Person ID, Production ID
INSERT INTO CONTRACT (contract_id, person_id, production_id, advance_paid, profit_share, remuneration, contract_type, status) VALUES
(101, 1, 1, 50000000.00, 30.00, 100000000.00, 'Lead Actor & Producer', 'Executed'), -- Aamir for Dangal
(102, 3, 2, 80000000.00, 40.00, 150000000.00, 'Lead Actor Profit Share', 'Executed'), -- SRK for Pathaan
(103, 19, 9, 20000000.00, 5.00, 60000000.00, 'Lead Actor Standard', 'Executed'); -- Shahid for Kabir Singh

INSERT INTO LEGAL_DISPUTE (movie_id, contract_id, plaintiff, dispute_type) VALUES
(1, 101, 'PRG Sports Authority', 'Defamation & Portrayal Issues'), -- Dangal dispute
(2, 102, 'Censorship Advocacy Group', 'Public Interest Litigation (Obscenity)'), -- Pathaan dispute
(11, 103, 'Medical Board of India', 'Violation of Medical Ethics Portrayal'); -- Kabir Singh dispute

-- =========================
-- 3. NORMALIZED AWARDS SYSTEM
-- =========================

INSERT INTO AWARD (award_id, award_name, awarding_body, prestige_tier) VALUES
(1, 'Filmfare Awards', 'The Times Group', 4),
(2, 'National Film Awards', 'Directorate of Film Festivals', 5);

INSERT INTO AWARD_CATEGORY (category_id, category_name) VALUES
(1, 'Best Actor in a Leading Role'),
(2, 'Best Director'),
(3, 'Best Music Director'),
(4, 'Best Male Playback Singer');

-- Note: The PK here is (award_id, category_id, person_id, movie_id, ceremony_year)
INSERT INTO AWARD_NOMINATION (award_id, category_id, person_id, movie_id, ceremony_year, result) VALUES
-- Aamir Khan won Best Actor for Dangal
(1, 1, 1, 1, 2017, 'Won'),
-- Nitesh Tiwari won Best Director for Dangal
(1, 2, 2, 1, 2017, 'Won'),
-- Ranbir Kapoor won Best Actor for Rockstar
(1, 1, 14, 10, 2012, 'Won'),
-- SRK nominated for Jawan
(1, 1, 3, 3, 2024, 'Nominated');

-- Note: The FK must exactly match the existing 5-column composite key in AWARD_NOMINATION
INSERT INTO SONG_NOMINATION (award_id, category_id, person_id, movie_id, ceremony_year, song_id) VALUES
-- Simulating Arijit Singh (if we had him) or Ranbir linked to 'Tum Hi Ho' (Song ID 3). 
-- Since we must reference an existing Award Nomination, we will map a fictional music nomination to Ranbir for demonstration.
(1, 1, 14, 10, 2012, 5); -- Linking 'Kun Faya Kun' (Song ID 5) to Ranbir's Rockstar nomination

-- =========================
-- 4. PARENTAL GUIDES
-- =========================

INSERT INTO GUIDE_CATEGORY (guide_category_id, guide_category_name) VALUES
(1, 'Violence & Gore'),
(2, 'Profanity'),
(3, 'Alcohol, Drugs & Smoking'),
(4, 'Frightening & Intense Scenes');

INSERT INTO MOVIE_PARENTAL_GUIDE (movie_id, guide_category_id, level) VALUES
(2, 1, 'Moderate'), -- Pathaan: Violence
(11, 2, 'Severe'), -- Kabir Singh: Profanity
(11, 3, 'Severe'), -- Kabir Singh: Drugs/Alcohol
(6, 4, 'Moderate'), -- Andhadhun: Intense Scenes
(5, 2, 'Moderate'); -- Gully Boy: Profanity

-- =========================
-- 5. BOX OFFICE DAILY ENTRIES
-- =========================
-- We use a subquery to grab the auto-generated box_office_id based on the movie_id

INSERT INTO DAY_ENTRY (box_office_id, day_no, date, collection) VALUES
((SELECT box_office_id FROM BOX_OFFICE WHERE movie_id = 2), 1, '2023-01-25', 57000000.00),
((SELECT box_office_id FROM BOX_OFFICE WHERE movie_id = 2), 2, '2023-01-26', 70000000.00), -- Republic Day boost
((SELECT box_office_id FROM BOX_OFFICE WHERE movie_id = 2), 3, '2023-01-27', 39000000.00),

((SELECT box_office_id FROM BOX_OFFICE WHERE movie_id = 3), 1, '2023-09-07', 75000000.00),
((SELECT box_office_id FROM BOX_OFFICE WHERE movie_id = 3), 2, '2023-09-08', 53000000.00);

-- =========================
-- 6. THEATRES & SCHEDULES
-- =========================

INSERT INTO THEATRE (theatre_id, name, city, state, has_imax, screen_count, seating_capacity) VALUES
(1, 'PVR Icon: Phoenix Palladium', 'Mumbai', 'Maharashtra', TRUE, 8, 1450),
(2, 'INOX: Megaplex', 'Delhi', 'Delhi', TRUE, 10, 2000),
(3, 'Cinepolis: Forum Mall', 'Bangalore', 'Karnataka', FALSE, 6, 1200);

-- Linking Pathaan and Jawan to specific screens
INSERT INTO SHOW_SCHEDULE (movie_id, theatre_id, show_datetime, screen_no, seats_sold, screen_format) VALUES
(2, 1, '2023-01-25 09:00:00', 1, 350, 'IMAX 2D'),
(2, 1, '2023-01-25 13:00:00', 1, 345, 'IMAX 2D'),
(3, 2, '2023-09-07 18:30:00', 4, 410, '4DX'),
(3, 3, '2023-09-07 21:00:00', 2, 280, 'Standard 2D');

-- =========================
-- 7. DISTRIBUTORS & RIGHTS
-- =========================

INSERT INTO DISTRIBUTOR (distributor_id, company_name, distribution_type) VALUES
(1, 'YRF Distribution', 'Global Theatrical'),
(2, 'AA Films', 'Domestic Theatrical'),
(3, 'Pen Marudhar Entertainment', 'Domestic Theatrical'),
(4, 'Amazon Prime Video', 'Digital Streaming (OTT)');

INSERT INTO DISTRIBUTION_RIGHT (movie_id, distributor_id, start_date, end_date, territory, dead_status) VALUES
(2, 1, '2023-01-25', '2033-01-24', 'Worldwide', FALSE), -- Pathaan
(3, 3, '2023-09-07', '2033-09-06', 'India (North)', FALSE), -- Jawan Theatrical
(3, 4, '2023-11-02', '2028-11-01', 'Global Digital', FALSE), -- Jawan OTT
(15, 2, '2017-10-20', '2027-10-19', 'India', FALSE); -- Golmaal Again

-- =========================
-- 8. VIEWERSHIP ANALYTICS
-- =========================

INSERT INTO VIEWERSHIP_ANALYTICS (movie_id, distributor_id, recorded_date, revenue_generator, view_count, region) VALUES
(3, 4, '2023-11-05', 'Subscription (SVOD)', 4500000, 'India'),
(3, 4, '2023-11-05', 'Subscription (SVOD)', 1200000, 'North America'),
(2, 1, '2023-02-15', 'Theatrical Ticket Sales', 8500000, 'India'),
(2, 1, '2023-02-15', 'Theatrical Ticket Sales', 2100000, 'Middle East');

-- =========================================================
-- END OF SEED SCRIPT (PART 2)
-- =========================================================