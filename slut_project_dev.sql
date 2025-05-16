-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Värd: 127.0.0.1
-- Tid vid skapande: 16 maj 2025 kl 10:08
-- Serverversion: 10.4.32-MariaDB
-- PHP-version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Databas: `slut_project_dev`
--

-- --------------------------------------------------------

--
-- Tabellstruktur `sequelizemeta`
--

CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumpning av Data i tabell `sequelizemeta`
--

INSERT INTO `sequelizemeta` (`name`) VALUES
('20250206125343-create-tricks-table.js'),
('20250210143239-create-transitions-table.js'),
('20250211152735-link-transitions-to-tricks.js'),
('20250310102237-add-from-and-to-colums-to-tricks-table.js'),
('20250324100403-create-Users-table.js'),
('20250324101534-create-UserFriends-table.js'),
('20250328110143-add-description-and-profilepicture-coloum-to-user-table.js'),
('20250407085327-add-access-coulmns-to-tricks-table.js'),
('20250512092622-drop-Transitions-Table.js'),
('20250515085924-rename-of-coulm-in-Tricks-Table.js');

-- --------------------------------------------------------

--
-- Tabellstruktur `tricks`
--

CREATE TABLE `tricks` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sudoNames` varchar(255) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `difficulty` int(11) NOT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `images` varchar(255) DEFAULT NULL,
  `videos` varchar(255) DEFAULT NULL,
  `external_links` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `from` int(11) DEFAULT NULL,
  `to` int(11) DEFAULT NULL,
  `ownerId` int(11) DEFAULT NULL,
  `visibility` enum('everyone','friends','only_me') NOT NULL DEFAULT 'friends',
  `edit_perms` enum('public','friends','only_me') NOT NULL DEFAULT 'only_me'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumpning av Data i tabell `tricks`
--

INSERT INTO `tricks` (`id`, `name`, `sudoNames`, `description`, `difficulty`, `tags`, `images`, `videos`, `external_links`, `createdAt`, `updatedAt`, `from`, `to`, `ownerId`, `visibility`, `edit_perms`) VALUES
(7, 'test2', NULL, 'aegriuegriuhsegråohseg+uh awd', 5, '[\"Test\"]', '[\"7_1739791671796.png\"]', NULL, NULL, '2025-02-17 11:27:51', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(9, 'test3', NULL, 'egsrionsoerigg', 3, '[\"Test\"]', '[\"9_1739792159773.png\"]', NULL, NULL, '2025-02-17 11:35:59', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(11, 'test5', NULL, 'egsrionsoerigg', 3, '[\"Test\"]', '[\"11_1739792240662.png\"]', NULL, NULL, '2025-02-17 11:37:20', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(14, 'test8', NULL, 'egsrionsoerigg', 3, '[\"Test\"]', '[\"14_1739796964476.png\"]', NULL, NULL, '2025-02-17 12:56:04', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(17, 'test11', NULL, 'egsrionsoerigg', 3, '[\"Test\"]', '[\"17_1739797191307.png\"]', NULL, NULL, '2025-02-17 12:59:51', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(18, 'test12', NULL, 'awdsgeeag', 2, '[\"Test\"]', '[\"18_1739797242539.png\"]', NULL, NULL, '2025-02-17 13:00:42', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(19, 'test13', NULL, 'awdsgeeag', 2, '[\"Test\"]', '[\"19_1739797334585.png\"]', NULL, NULL, '2025-02-17 13:02:14', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(20, 'testtt', NULL, 'testetstest', 2, '[\"Test\"]', '[\"20_1741599996505.png\"]', NULL, NULL, '2025-03-10 09:46:36', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(23, 'even more test', NULL, 'awdasdwadawd', 1, '[\"Test\"]', '[\"23_1741869430054.png\"]', 'null', NULL, '2025-03-13 12:37:09', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(25, 'teeeest', NULL, 'aaaa', 1, '[\"Test\"]', '[\"25_1742205279114.png\"]', 'null', NULL, '2025-03-17 09:54:39', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(26, 'testaa', NULL, '22', 1, '[\"Test\"]', '[\"26_1742206336159.png\"]', 'null', NULL, '2025-03-17 10:12:16', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(27, 'testaa', NULL, '22', 1, '[\"Test\"]', '[\"27_1742206457918.png\"]', 'null', NULL, '2025-03-17 10:14:17', '2025-05-14 13:08:11', NULL, NULL, NULL, 'friends', 'only_me'),
(28, 'awdswa', NULL, '111', 1, '[\"Test\"]', '[\"28_1742206540076.png\"]', 'null', NULL, '2025-03-17 10:15:40', '2025-05-14 13:08:11', 17, 23, NULL, 'friends', 'only_me'),
(51, 'wadsawd', '[\"Test\",\"Hi\"]', 'testtest', 1, '[\"Test\",\"Test2\"]', '[\"51_1747040647101.png\"]', 'null', NULL, '2025-05-12 09:04:07', '2025-05-14 11:20:31', NULL, NULL, 1, 'friends', 'only_me'),
(52, 'awdasddaw', NULL, 'wadawdsaw', 1, '[\"Test\"]', '[\"52_1747040756115.png\"]', 'null', NULL, '2025-05-12 09:05:56', '2025-05-14 13:08:11', NULL, 23, 1, 'friends', 'only_me'),
(53, 'video', '[\"Test\",\" hi\"]', 'wadawdwda', 1, '[\"Test\",\"Test2\"]', '[]', 'null', NULL, '2025-05-12 09:15:39', '2025-05-14 11:15:17', NULL, 28, 1, 'friends', 'only_me'),
(54, 'matte 5', NULL, 'en del av min matte 5 pressentation', 5, '[\"Test\",\"Video\"]', '[]', '[\"54_1747298658019.mp4\"]', NULL, '2025-05-15 08:44:17', '2025-05-15 08:44:18', 7, NULL, 1, 'friends', 'only_me'),
(55, 'another trick!!', NULL, 'aaaaaaaaaaaaaaaaa', 1, '[\"Test2\"]', '[\"55_1747311653779.png\"]', '[]', NULL, '2025-05-15 12:20:53', '2025-05-15 12:20:53', 52, 19, NULL, 'friends', 'only_me');

-- --------------------------------------------------------

--
-- Tabellstruktur `tricks_granted_users`
--

CREATE TABLE `tricks_granted_users` (
  `trick_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `userfriends`
--

CREATE TABLE `userfriends` (
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int(11) NOT NULL,
  `friendId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `profilePicture` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumpning av Data i tabell `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `createdAt`, `updatedAt`, `description`, `profilePicture`) VALUES
(1, 'Ererej', '$2b$10$iuULiQcBiYqmp2eBK/ushOI4AkuJOU6U9Fo5R.L7YQYaJvTBJ6eNC', 'admin', '2025-03-27 12:20:00', '2025-03-27 12:20:00', NULL, '1__profilePicture.png');

--
-- Index för dumpade tabeller
--

--
-- Index för tabell `sequelizemeta`
--
ALTER TABLE `sequelizemeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Index för tabell `tricks`
--
ALTER TABLE `tricks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tricks_from_foreign_idx` (`from`),
  ADD KEY `tricks_to_foreign_idx` (`to`),
  ADD KEY `tricks_owner_foreign_idx` (`ownerId`);

--
-- Index för tabell `tricks_granted_users`
--
ALTER TABLE `tricks_granted_users`
  ADD KEY `trick_id` (`trick_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index för tabell `userfriends`
--
ALTER TABLE `userfriends`
  ADD PRIMARY KEY (`userId`,`friendId`),
  ADD KEY `friendId` (`friendId`);

--
-- Index för tabell `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT för dumpade tabeller
--

--
-- AUTO_INCREMENT för tabell `tricks`
--
ALTER TABLE `tricks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT för tabell `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restriktioner för dumpade tabeller
--

--
-- Restriktioner för tabell `tricks`
--
ALTER TABLE `tricks`
  ADD CONSTRAINT `tricks_from_foreign_idx` FOREIGN KEY (`from`) REFERENCES `tricks` (`id`),
  ADD CONSTRAINT `tricks_owner_foreign_idx` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `tricks_to_foreign_idx` FOREIGN KEY (`to`) REFERENCES `tricks` (`id`);

--
-- Restriktioner för tabell `tricks_granted_users`
--
ALTER TABLE `tricks_granted_users`
  ADD CONSTRAINT `tricks_granted_users_ibfk_1` FOREIGN KEY (`trick_id`) REFERENCES `tricks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tricks_granted_users_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restriktioner för tabell `userfriends`
--
ALTER TABLE `userfriends`
  ADD CONSTRAINT `userfriends_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `userfriends_ibfk_2` FOREIGN KEY (`friendId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
