use aes_gcm::aead::{Aead, OsRng};
use aes_gcm::{AeadCore, Aes256Gcm, Key, KeyInit};
use argon2::Argon2;
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use serde::{Deserialize, Serialize};

/// Encrypted vault stored on disk. Contains the encrypted mnemonic
/// and all parameters needed for decryption.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedVault {
    pub ciphertext: String,
    pub nonce: String,
    pub salt: String,
}

/// Encrypt a mnemonic phrase using AES-256-GCM with an Argon2id-derived key.
///
/// Security design:
/// 1. Generate 16-byte random salt
/// 2. Derive 32-byte key from password using Argon2id (memory-hard KDF)
/// 3. Encrypt mnemonic with AES-256-GCM (authenticated encryption)
/// 4. Store {ciphertext, nonce, salt} — all needed for decryption
pub fn encrypt_mnemonic(mnemonic: &str, password: &str) -> anyhow::Result<EncryptedVault> {
    // Generate random salt
    let mut salt = [0u8; 16];
    rand::RngCore::fill_bytes(&mut OsRng, &mut salt);

    // Derive key with Argon2id
    let mut key_bytes = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), &salt, &mut key_bytes)
        .map_err(|e| anyhow::anyhow!("Argon2 key derivation failed: {e}"))?;

    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    // Encrypt
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, mnemonic.as_bytes())
        .map_err(|e| anyhow::anyhow!("Encryption failed: {e}"))?;

    Ok(EncryptedVault {
        ciphertext: BASE64.encode(ciphertext),
        nonce: BASE64.encode(nonce),
        salt: BASE64.encode(salt),
    })
}

/// Decrypt a mnemonic phrase from an encrypted vault.
///
/// Returns `Err` if the password is wrong or data is corrupted
/// (AES-GCM authentication tag verification failure).
pub fn decrypt_mnemonic(vault: &EncryptedVault, password: &str) -> anyhow::Result<String> {
    let salt = BASE64
        .decode(&vault.salt)
        .map_err(|e| anyhow::anyhow!("Invalid salt: {e}"))?;
    let nonce_bytes = BASE64
        .decode(&vault.nonce)
        .map_err(|e| anyhow::anyhow!("Invalid nonce: {e}"))?;
    let ciphertext = BASE64
        .decode(&vault.ciphertext)
        .map_err(|e| anyhow::anyhow!("Invalid ciphertext: {e}"))?;

    // Re-derive key
    let mut key_bytes = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), &salt, &mut key_bytes)
        .map_err(|e| anyhow::anyhow!("Argon2 key derivation failed: {e}"))?;

    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let nonce = aes_gcm::Nonce::from_slice(&nonce_bytes);
    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| anyhow::anyhow!("Decryption failed — wrong password or corrupted data"))?;

    String::from_utf8(plaintext)
        .map_err(|e| anyhow::anyhow!("Invalid UTF-8 in decrypted data: {e}"))
}

/// Save an encrypted vault to a file path.
pub fn save_vault(vault: &EncryptedVault, path: &std::path::Path) -> anyhow::Result<()> {
    let json = serde_json::to_string_pretty(vault)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path, json)?;
    Ok(())
}

/// Load an encrypted vault from a file path.
pub fn load_vault(path: &std::path::Path) -> anyhow::Result<EncryptedVault> {
    let json = std::fs::read_to_string(path)?;
    let vault: EncryptedVault = serde_json::from_str(&json)?;
    Ok(vault)
}

/// Get the default vault file path (~/.webwallet/vault.json).
pub fn default_vault_path() -> std::path::PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    home.join(".webwallet").join("vault.json")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let password = "test_password_123";

        let vault = encrypt_mnemonic(mnemonic, password).unwrap();
        let decrypted = decrypt_mnemonic(&vault, password).unwrap();

        assert_eq!(mnemonic, decrypted);
    }

    #[test]
    fn test_wrong_password_fails() {
        let mnemonic = "test mnemonic phrase";
        let vault = encrypt_mnemonic(mnemonic, "correct_password").unwrap();
        let result = decrypt_mnemonic(&vault, "wrong_password");

        assert!(result.is_err());
    }

    #[test]
    fn test_vault_serialization() {
        let vault = encrypt_mnemonic("test data", "password").unwrap();
        let json = serde_json::to_string(&vault).unwrap();
        let deserialized: EncryptedVault = serde_json::from_str(&json).unwrap();

        assert_eq!(vault.ciphertext, deserialized.ciphertext);
        assert_eq!(vault.nonce, deserialized.nonce);
        assert_eq!(vault.salt, deserialized.salt);
    }
}
