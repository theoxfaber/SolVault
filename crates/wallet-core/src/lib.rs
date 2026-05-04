pub mod keypair;
pub mod rpc;
pub mod transaction;
pub mod vault;

use serde::{Deserialize, Serialize};

/// A wallet account derived from the master mnemonic.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletAccount {
    pub name: String,
    pub public_key: String,
    pub derivation_index: u32,
    pub balance_sol: f64,
}

impl WalletAccount {
    pub fn new(name: String, public_key: String, index: u32) -> Self {
        Self {
            name,
            public_key,
            derivation_index: index,
            balance_sol: 0.0,
        }
    }
}

impl std::fmt::Display for WalletAccount {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{} ({}) — {} SOL",
            self.name,
            rpc::format_address(&self.public_key),
            self.balance_sol
        )
    }
}
