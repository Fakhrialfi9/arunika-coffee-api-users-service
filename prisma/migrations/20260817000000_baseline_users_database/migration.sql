-- Baseline migration for the existing arunika_coffee_users database.
-- CREATE TABLE IF NOT EXISTS keeps deployment safe when the database is already provisioned.

CREATE TABLE IF NOT EXISTS `authentication_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `username` VARCHAR(100) NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(30) NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authentication_users_uuid_key` (`uuid`),
  UNIQUE KEY `authentication_users_username_key` (`username`),
  UNIQUE KEY `authentication_users_email_key` (`email`),
  UNIQUE KEY `authentication_users_phone_key` (`phone`),
  KEY `authentication_users_status_idx` (`status`),
  KEY `authentication_users_is_active_idx` (`is_active`),
  KEY `authentication_users_deleted_at_idx` (`deleted_at`),
  KEY `authentication_users_status_deleted_at_idx` (`status`, `deleted_at`),
  KEY `authentication_users_is_active_deleted_at_idx` (`is_active`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `authentication_user_profiles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `first_name` VARCHAR(100) NULL,
  `last_name` VARCHAR(100) NULL,
  `image_url` VARCHAR(500) NULL,
  `avatar_thumbnail_url` VARCHAR(500) NULL,
  `timezone` VARCHAR(100) NOT NULL DEFAULT 'Asia/Jakarta',
  `locale` VARCHAR(10) NOT NULL DEFAULT 'id',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authentication_user_profiles_user_id_key` (`user_id`),
  CONSTRAINT `authentication_user_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `authentication_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `authentication_user_credentials` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `password_changed_at` DATETIME NULL,
  `password_expires_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authentication_user_credentials_user_id_key` (`user_id`),
  CONSTRAINT `authentication_user_credentials_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `authentication_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `authentication_user_security` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `email_verified_at` DATETIME NULL,
  `phone_verified_at` DATETIME NULL,
  `last_login_at` DATETIME NULL,
  `last_login_ip` VARCHAR(45) NULL,
  `failed_login_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authentication_user_security_user_id_key` (`user_id`),
  CONSTRAINT `authentication_user_security_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `authentication_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `authentication_user_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `session_id` VARCHAR(64) NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `last_activity_at` DATETIME NULL,
  `revoked_at` DATETIME NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authentication_user_sessions_session_id_key` (`session_id`),
  KEY `authentication_user_sessions_user_id_idx` (`user_id`),
  KEY `authentication_user_sessions_revoked_at_idx` (`revoked_at`),
  KEY `authentication_user_sessions_expires_at_idx` (`expires_at`),
  CONSTRAINT `authentication_user_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `authentication_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `authentication_user_two_factors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `method` VARCHAR(30) NOT NULL DEFAULT 'totp',
  `secret_encrypted` TEXT NOT NULL,
  `enabled_at` DATETIME NULL,
  `last_used_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authentication_user_two_factors_user_id_key` (`user_id`),
  CONSTRAINT `authentication_user_two_factors_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `authentication_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `authorization_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authorization_roles_uuid_key` (`uuid`),
  UNIQUE KEY `authorization_roles_code_key` (`code`),
  KEY `authorization_roles_is_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `authorization_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(150) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `domain` VARCHAR(100) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authorization_permissions_uuid_key` (`uuid`),
  UNIQUE KEY `authorization_permissions_code_key` (`code`),
  KEY `authorization_permissions_module_idx` (`module`),
  KEY `authorization_permissions_domain_idx` (`domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `authorization_user_roles` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role_id` BIGINT UNSIGNED NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `assigned_by` BIGINT UNSIGNED NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `role_id`),
  KEY `authorization_user_roles_is_active_idx` (`is_active`),
  KEY `authorization_user_roles_assigned_by_idx` (`assigned_by`),
  CONSTRAINT `authorization_user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `authentication_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `authorization_user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `authorization_roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `authorization_user_roles_assigned_by_fkey` FOREIGN KEY (`assigned_by`) REFERENCES `authentication_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `authorization_role_permissions` (
  `role_id` BIGINT UNSIGNED NOT NULL,
  `permission_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `authorization_role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `authorization_roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `authorization_role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `authorization_permissions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) NULL,
  `entity_id` BIGINT UNSIGNED NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `request_id` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `audit_logs_uuid_key` (`uuid`),
  KEY `audit_logs_user_id_idx` (`user_id`),
  KEY `audit_logs_action_idx` (`action`),
  KEY `audit_logs_entity_type_idx` (`entity_type`),
  KEY `audit_logs_entity_id_idx` (`entity_id`),
  KEY `audit_logs_request_id_idx` (`request_id`),
  KEY `audit_logs_created_at_idx` (`created_at`),
  CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `authentication_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_log_changes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `audit_log_id` BIGINT UNSIGNED NOT NULL,
  `field` VARCHAR(100) NOT NULL,
  `old_value` JSON NULL,
  `new_value` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `audit_log_changes_audit_log_id_idx` (`audit_log_id`),
  CONSTRAINT `audit_log_changes_audit_log_id_fkey` FOREIGN KEY (`audit_log_id`) REFERENCES `audit_logs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
