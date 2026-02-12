-- Horoscope sends: when user uploads PDF and sends to WhatsApp numbers
CREATE TABLE IF NOT EXISTS horoscope_sends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id VARCHAR(100) NOT NULL,
  recipient_whatsapp VARCHAR(20) NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_registration (registration_id),
  INDEX idx_sent_at (sent_at)
);

-- Profile detail sends: when user sends profile details to WhatsApp numbers
CREATE TABLE IF NOT EXISTS profile_detail_sends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id VARCHAR(100) NOT NULL,
  recipient_whatsapp VARCHAR(20) NOT NULL,
  fields_sent JSON,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_registration (registration_id),
  INDEX idx_sent_at (sent_at)
);
