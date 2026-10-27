-- ==========================================================
-- SƠ ĐỒ CƠ SỞ DỮ LIỆU BUDGLEE PLATFORM (6 THỰC THỂ CỐT LÕI)
-- Phụ trách: Bàng Trọng Tú (Database & Data Lead)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `budglee_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `budglee_db`;

-- 1. Bảng Users
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `avatar_url` VARCHAR(255) NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL_USER',
    `family_group_id` VARCHAR(50) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_family` (`family_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Wallets (Ví / Thẻ tài khoản)
CREATE TABLE IF NOT EXISTS `wallets` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `family_group_id` VARCHAR(50) NULL,
    `wallet_name` VARCHAR(100) NOT NULL,
    `card_number_masked` VARCHAR(20) NULL,
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'VND',
    `type` VARCHAR(30) NOT NULL DEFAULT 'CASH', -- CASH, BANK, CREDIT_CARD
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_wallets_user` (`user_id`),
    INDEX `idx_wallets_family` (`family_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Categories (Danh mục thu chi)
CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL, -- INCOME, EXPENSE
    `icon` VARCHAR(50) NULL,
    `color_code` VARCHAR(20) NULL,
    `user_id` BIGINT NULL, -- NULL nếu là danh mục mặc định của hệ thống
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_categories_user_type` (`user_id`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Transactions (Giao dịch thu/chi/chuyển khoản)
CREATE TABLE IF NOT EXISTS `transactions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `wallet_id` BIGINT NOT NULL,
    `category_id` BIGINT NULL,
    `user_id` BIGINT NOT NULL,
    `action_title` VARCHAR(200) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `transaction_type` VARCHAR(20) NOT NULL, -- INCOME, EXPENSE, TRANSFER
    `balance_after` DECIMAL(15, 2) NOT NULL,
    `transaction_date` DATETIME NOT NULL,
    `note` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_tx_user_date` (`user_id`, `transaction_date`),
    INDEX `idx_tx_wallet` (`wallet_id`),
    INDEX `idx_tx_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng Budgets (Ngân sách & Hạn mức chi tiêu)
CREATE TABLE IF NOT EXISTS `budgets` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `category_id` BIGINT NULL,
    `amount_limit` DECIMAL(15, 2) NOT NULL,
    `spent_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `period_month` INT NOT NULL,
    `period_year` INT NOT NULL,
    `alert_threshold` DECIMAL(5, 2) NOT NULL DEFAULT 80.00, -- Mặc định cảnh báo ở 80%
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
    INDEX `idx_budgets_period` (`user_id`, `period_year`, `period_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng Saving Goals (Mục tiêu tiết kiệm dài hạn)
CREATE TABLE IF NOT EXISTS `saving_goals` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `goal_name` VARCHAR(150) NOT NULL,
    `target_amount` DECIMAL(15, 2) NOT NULL,
    `current_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `deadline` DATE NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, CANCELLED
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_goals_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed dữ liệu mẫu cho Categories mặc định
INSERT INTO `categories` (`name`, `type`, `icon`, `color_code`, `user_id`) VALUES
('Ăn uống (Food & Drinks)', 'EXPENSE', 'Utensils', '#F59E0B', NULL),
('Mua sắm (Shopping)', 'EXPENSE', 'ShoppingBag', '#EF4444', NULL),
('Di chuyển (Travel & Transport)', 'EXPENSE', 'Car', '#3B82F6', NULL),
('Sức khỏe & Y tế (Health)', 'EXPENSE', 'HeartPulse', '#10B981', NULL),
('Hóa đơn sinh hoạt (Bills & Utilities)', 'EXPENSE', 'Receipt', '#6366F1', NULL),
('Giáo dục (Education)', 'EXPENSE', 'GraduationCap', '#8B5CF6', NULL),
('Lương (Salary)', 'INCOME', 'BadgeDollarSign', '#22C55E', NULL),
('Đầu tư (Investment)', 'INCOME', 'TrendingUp', '#06B6D4', NULL),
('Thu nhập khác (Other Income)', 'INCOME', 'PlusCircle', '#14B8A6', NULL)
ON DUPLICATE KEY UPDATE `name`=`name`;
