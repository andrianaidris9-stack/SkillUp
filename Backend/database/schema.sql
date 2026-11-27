-- SkillUp Kota Ternate - skema basis data Tahap 5
-- MySQL 8.0+ / InnoDB / utf8mb4

CREATE DATABASE IF NOT EXISTS skillup
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillup;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  session_version INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  email_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role,status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS participant_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  birth_date DATE NULL,
  education VARCHAR(40) NULL,
  work_experience VARCHAR(80) NULL,
  address VARCHAR(500) NULL,
  photo_path VARCHAR(255) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_participant_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  position VARCHAR(120) NULL,
  photo_path VARCHAR(255) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS training_categories (
  code CHAR(3) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO training_categories (code,name) VALUES
('KEC','Kecantikan dan Tata Rias'),
('KUL','Kuliner dan Tata Boga'),
('TEK','Teknik dan Alat Berat'),
('BUS','Tata Busana dan Kerajinan'),
('ADM','Administrasi dan Teknologi'),
('LIS','Kelistrikan dan Keterampilan Teknik'),
('PAR','Pariwisata dan Perhotelan'),
('WIR','Kewirausahaan');

CREATE TABLE IF NOT EXISTS training_programs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  category_code CHAR(3) NOT NULL,
  level VARCHAR(40) NOT NULL,
  duration_hours SMALLINT UNSIGNED NOT NULL,
  fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  instructor VARCHAR(120) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('Draft','Published') NOT NULL DEFAULT 'Draft',
  description TEXT NOT NULL,
  cover_image VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_training_category FOREIGN KEY (category_code) REFERENCES training_categories(code),
  CONSTRAINT fk_training_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_training_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_training_duration CHECK (duration_hours > 0),
  CONSTRAINT chk_training_fee CHECK (fee >= 0),
  CONSTRAINT chk_training_dates CHECK (end_date >= start_date),
  KEY idx_training_public (status,deleted_at,category_code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS initial_assessments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  participant_id BIGINT UNSIGNED NOT NULL,
  interest_category_code CHAR(3) NOT NULL,
  computer_level ENUM('Dasar','Menengah','Mahir') NOT NULL,
  communication_level ENUM('Dasar','Menengah','Mahir') NOT NULL,
  status ENUM('submitted','reviewed','ready','classified','archived') NOT NULL DEFAULT 'submitted',
  is_current TINYINT(1) NOT NULL DEFAULT 1,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_admin_id BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  current_participant_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN is_current = 1 THEN participant_id ELSE NULL END) STORED,
  CONSTRAINT fk_initial_participant FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_initial_category FOREIGN KEY (interest_category_code) REFERENCES training_categories(code),
  CONSTRAINT fk_initial_admin FOREIGN KEY (created_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_current_initial_assessment (current_participant_id),
  KEY idx_initial_status (status,submitted_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS practical_assessments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  initial_assessment_id BIGINT UNSIGNED NOT NULL,
  participant_id BIGINT UNSIGNED NOT NULL,
  admin_id BIGINT UNSIGNED NOT NULL,
  category_code CHAR(3) NOT NULL,
  indicators JSON NOT NULL,
  independence_level VARCHAR(50) NOT NULL,
  practical_level ENUM('Dasar','Menengah','Mahir') NOT NULL,
  notes TEXT NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 1,
  assessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_assessment_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN is_current = 1 THEN initial_assessment_id ELSE NULL END) STORED,
  CONSTRAINT fk_practical_initial FOREIGN KEY (initial_assessment_id) REFERENCES initial_assessments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_practical_participant FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_practical_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_practical_category FOREIGN KEY (category_code) REFERENCES training_categories(code),
  UNIQUE KEY uq_current_practical_assessment (current_assessment_id),
  KEY idx_practical_participant (participant_id,assessed_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS classifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  participant_id BIGINT UNSIGNED NOT NULL,
  initial_assessment_id BIGINT UNSIGNED NOT NULL,
  practical_assessment_id BIGINT UNSIGNED NOT NULL,
  predicted_category_code CHAR(3) NOT NULL,
  model_version VARCHAR(80) NOT NULL,
  explanation TEXT NULL,
  input_snapshot JSON NOT NULL,
  processed_by_admin_id BIGINT UNSIGNED NOT NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 1,
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_participant_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN is_current = 1 THEN participant_id ELSE NULL END) STORED,
  CONSTRAINT fk_class_participant FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_class_initial FOREIGN KEY (initial_assessment_id) REFERENCES initial_assessments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_class_practical FOREIGN KEY (practical_assessment_id) REFERENCES practical_assessments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_class_category FOREIGN KEY (predicted_category_code) REFERENCES training_categories(code),
  CONSTRAINT fk_class_admin FOREIGN KEY (processed_by_admin_id) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_current_classification (current_participant_id),
  KEY idx_classification_history (participant_id,processed_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS classification_recommendations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  classification_id BIGINT UNSIGNED NOT NULL,
  training_program_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommendation_classification FOREIGN KEY (classification_id) REFERENCES classifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_recommendation_training FOREIGN KEY (training_program_id) REFERENCES training_programs(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_classification_program (classification_id,training_program_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_login_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  ip_address VARCHAR(45) NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  succeeded TINYINT(1) NOT NULL DEFAULT 0,
  KEY idx_login_attempts (email,ip_address,attempted_at,succeeded)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_reset_token_hash (token_hash),
  KEY idx_reset_user_expiry (user_id,expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_activity_created (created_at),
  KEY idx_activity_actor (actor_user_id,created_at)
) ENGINE=InnoDB;
