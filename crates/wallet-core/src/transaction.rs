use std::str::FromStr;

use solana_client::rpc_client::RpcClient;
use solana_sdk::native_token::LAMPORTS_PER_SOL;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;
use solana_sdk::transaction::Transaction;

/// Send SOL from one account to another.
///
/// Constructs, signs, and submits a SystemProgram::transfer transaction.
/// Returns the transaction signature on success.
pub fn send_sol(
    client: &RpcClient,
    from_keypair: &Keypair,
    to_address: &str,
    sol_amount: f64,
) -> anyhow::Result<String> {
    let to_pubkey = Pubkey::from_str(to_address)
        .map_err(|e| anyhow::anyhow!("Invalid recipient address: {e}"))?;

    let lamports = (sol_amount * LAMPORTS_PER_SOL as f64) as u64;

    // Check sender balance
    let balance = client.get_balance(&from_keypair.pubkey())?;
    if balance < lamports {
        anyhow::bail!(
            "Insufficient balance: have {} SOL, need {} SOL",
            balance as f64 / LAMPORTS_PER_SOL as f64,
            sol_amount
        );
    }

    // Use the system program transfer instruction
    let instruction = solana_sdk::system_instruction::transfer(
        &from_keypair.pubkey(),
        &to_pubkey,
        lamports,
    );

    let recent_blockhash = client.get_latest_blockhash()?;
    let transaction = Transaction::new_signed_with_payer(
        &[instruction],
        Some(&from_keypair.pubkey()),
        &[from_keypair],
        recent_blockhash,
    );

    let signature = client.send_and_confirm_transaction(&transaction)?;
    Ok(signature.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_invalid_recipient_address() {
        let client = RpcClient::new("https://api.devnet.solana.com".to_string());
        let keypair = Keypair::new();
        let result = send_sol(&client, &keypair, "invalid!!!", 1.0);
        assert!(result.is_err());
    }
}
