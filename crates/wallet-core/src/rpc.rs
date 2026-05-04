use solana_client::rpc_client::RpcClient;
use solana_sdk::commitment_config::CommitmentConfig;
use solana_sdk::native_token::LAMPORTS_PER_SOL;
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

/// Default RPC endpoint (Solana devnet).
pub const DEFAULT_RPC_URL: &str = "https://api.devnet.solana.com";

/// Create a new RPC client with confirmed commitment.
pub fn new_client(url: &str) -> RpcClient {
    RpcClient::new_with_commitment(url.to_string(), CommitmentConfig::confirmed())
}

/// Get the SOL balance for an address.
pub fn get_balance(client: &RpcClient, address: &str) -> anyhow::Result<f64> {
    let pubkey = Pubkey::from_str(address)
        .map_err(|e| anyhow::anyhow!("Invalid address: {e}"))?;
    let lamports = client.get_balance(&pubkey)?;
    Ok(lamports as f64 / LAMPORTS_PER_SOL as f64)
}

/// Request an airdrop of SOL (devnet/testnet only).
pub fn request_airdrop(
    client: &RpcClient,
    address: &str,
    sol_amount: f64,
) -> anyhow::Result<String> {
    let pubkey = Pubkey::from_str(address)
        .map_err(|e| anyhow::anyhow!("Invalid address: {e}"))?;
    let lamports = (sol_amount * LAMPORTS_PER_SOL as f64) as u64;

    let sig = client.request_airdrop(&pubkey, lamports)?;

    // Wait for confirmation
    loop {
        let confirmed = client.confirm_transaction(&sig)?;
        if confirmed {
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(500));
    }

    Ok(sig.to_string())
}

/// Format a Solana address for display (truncated).
pub fn format_address(address: &str) -> String {
    if address.len() <= 10 {
        return address.to_string();
    }
    format!("{}...{}", &address[..6], &address[address.len() - 4..])
}

/// Validate a Solana address.
pub fn is_valid_address(address: &str) -> bool {
    Pubkey::from_str(address).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_address() {
        let addr = "7dGBRNRFbRiGQf2Aor2mLF4ynNeaQKJjxEHcjN1L1K5v";
        let formatted = format_address(addr);
        assert!(formatted.starts_with("7dGBRN"));
        assert!(formatted.ends_with("1K5v"));
        assert!(formatted.contains("..."));
    }

    #[test]
    fn test_valid_address() {
        assert!(is_valid_address(
            "11111111111111111111111111111111"
        ));
    }

    #[test]
    fn test_invalid_address() {
        assert!(!is_valid_address("not_a_valid_address_!!!"));
    }
}
