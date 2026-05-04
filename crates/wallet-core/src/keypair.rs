use bip39::Mnemonic;
use ed25519_dalek::SigningKey;
use hmac::{Hmac, Mac};
use sha2::Sha512;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;

type HmacSha512 = Hmac<Sha512>;

/// Generate a new random BIP39 mnemonic (24 words).
pub fn generate_mnemonic() -> Mnemonic {
    Mnemonic::generate(24).expect("Failed to generate mnemonic")
}

/// Derive an ed25519 keypair from a BIP39 mnemonic using the Solana
/// derivation path: m/44'/501'/{index}'/0'
///
/// Uses the BIP32-Ed25519 "SLIP-0010" algorithm:
/// 1. HMAC-SHA512 the seed with key "ed25519 seed" → master key
/// 2. For each path segment, HMAC-SHA512 with 0x00 || key || index_bytes
pub fn derive_keypair(mnemonic: &Mnemonic, index: u32) -> Keypair {
    // BIP39 seed (no passphrase)
    let seed = mnemonic.to_seed("");

    // SLIP-0010 master key derivation
    let mut mac =
        HmacSha512::new_from_slice(b"ed25519 seed").expect("HMAC accepts any key length");
    mac.update(&seed);
    let master = mac.finalize().into_bytes();

    let mut key = master[..32].to_vec();
    let mut chain_code = master[32..].to_vec();

    // Derivation path: m/44'/501'/{index}'/0'
    let path = [
        44 | 0x8000_0000,
        501 | 0x8000_0000,
        index | 0x8000_0000,
        0x8000_0000,
    ];

    for segment in &path {
        let mut data = vec![0u8]; // 0x00 prefix for hardened
        data.extend_from_slice(&key);
        data.extend_from_slice(&segment.to_be_bytes());

        let mut mac =
            HmacSha512::new_from_slice(&chain_code).expect("HMAC accepts any key length");
        mac.update(&data);
        let derived = mac.finalize().into_bytes();

        key = derived[..32].to_vec();
        chain_code = derived[32..].to_vec();
    }

    let signing_key = SigningKey::from_bytes(
        key.as_slice()
            .try_into()
            .expect("Key should be 32 bytes"),
    );
    let verifying_key = signing_key.verifying_key();

    // Construct Solana keypair from the 64-byte representation
    let mut keypair_bytes = [0u8; 64];
    keypair_bytes[..32].copy_from_slice(&signing_key.to_bytes());
    keypair_bytes[32..].copy_from_slice(verifying_key.as_bytes());

    Keypair::try_from(keypair_bytes.as_slice()).expect("Valid keypair bytes")
}

/// Get the public key (base58 address) for a derived keypair.
pub fn public_key_string(mnemonic: &Mnemonic, index: u32) -> String {
    let kp = derive_keypair(mnemonic, index);
    kp.pubkey().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mnemonic_generation() {
        let mnemonic = generate_mnemonic();
        let words: Vec<&str> = mnemonic.word_iter().collect();
        assert_eq!(words.len(), 24);
    }

    #[test]
    fn test_deterministic_derivation() {
        let mnemonic = Mnemonic::parse(
            "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"
        ).unwrap();

        let kp1 = derive_keypair(&mnemonic, 0);
        let kp2 = derive_keypair(&mnemonic, 0);

        // Same mnemonic + same index → same keypair
        assert_eq!(kp1.pubkey(), kp2.pubkey());
    }

    #[test]
    fn test_different_indices_yield_different_keys() {
        let mnemonic = generate_mnemonic();

        let kp0 = derive_keypair(&mnemonic, 0);
        let kp1 = derive_keypair(&mnemonic, 1);

        assert_ne!(kp0.pubkey(), kp1.pubkey());
    }

    #[test]
    fn test_public_key_is_valid_base58() {
        let mnemonic = generate_mnemonic();
        let pubkey = public_key_string(&mnemonic, 0);

        // Solana addresses are 32-44 chars of base58
        assert!(pubkey.len() >= 32 && pubkey.len() <= 44);
        assert!(pubkey.chars().all(|c| {
            c.is_ascii_alphanumeric() && c != '0' && c != 'O' && c != 'I' && c != 'l'
        }));
    }
}
