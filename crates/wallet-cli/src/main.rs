use std::path::PathBuf;

use bip39::Mnemonic;
use colored::Colorize;
use dialoguer::{Input, Password, Select};
use solana_sdk::signer::Signer;
use solvault_core::keypair;
use solvault_core::rpc;
use solvault_core::transaction;
use solvault_core::vault;
use solvault_core::WalletAccount;

fn main() -> anyhow::Result<()> {
    println!();
    println!("{}", "╔══════════════════════════════════════╗".purple());
    println!("{}", "║        SolVault — Solana Wallet      ║".purple());
    println!("{}", "║    Non-custodial • CLI • Rust-native ║".purple());
    println!("{}", "╚══════════════════════════════════════╝".purple());
    println!();

    let vault_path = vault::default_vault_path();

    if vault_path.exists() {
        // Existing wallet — unlock flow
        unlock_flow(&vault_path)?;
    } else {
        // No wallet — create or import
        let options = vec!["Create New Wallet", "Import from Mnemonic", "Exit"];
        let selection = Select::new()
            .with_prompt("No wallet found. What would you like to do?")
            .items(&options)
            .default(0)
            .interact()?;

        match selection {
            0 => create_wallet(&vault_path)?,
            1 => import_wallet(&vault_path)?,
            _ => {
                println!("{}", "Goodbye!".dimmed());
                return Ok(());
            }
        }
    }

    Ok(())
}

fn create_wallet(vault_path: &PathBuf) -> anyhow::Result<()> {
    println!("\n{}", "Creating a new wallet...".cyan());

    let password = Password::new()
        .with_prompt("Set a strong password")
        .with_confirmation("Confirm password", "Passwords don't match")
        .interact()?;

    let mnemonic = keypair::generate_mnemonic();

    println!("\n{}", "⚠️  IMPORTANT: Write down your recovery phrase!".yellow().bold());
    println!("{}", "   If you lose this, your funds are gone forever.".yellow());
    println!();

    let words: Vec<&str> = mnemonic.words().collect();
    for (i, word) in words.iter().enumerate() {
        print!("{:>2}. {:<15}", (i + 1).to_string().dimmed(), word.white().bold());
        if (i + 1) % 4 == 0 {
            println!();
        }
    }

    println!();
    let _confirm: String = Input::new()
        .with_prompt("Type 'I saved it' to continue")
        .validate_with(|input: &String| {
            if input.to_lowercase().contains("saved") {
                Ok(())
            } else {
                Err("Please confirm you've saved your recovery phrase")
            }
        })
        .interact_text()?;

    // Encrypt and save
    let encrypted = vault::encrypt_mnemonic(&mnemonic.to_string(), &password)?;
    vault::save_vault(&encrypted, vault_path)?;

    println!("\n{}", "✓ Wallet created and encrypted!".green().bold());

    // Show first account
    let kp = keypair::derive_keypair(&mnemonic, 0);
    let account = WalletAccount::new("Main Account".into(), kp.pubkey().to_string(), 0);

    println!("\n{}", "Your Solana address:".cyan());
    println!("  {}", account.public_key.white().bold());
    println!("\n{}", format!("Vault saved to: {}", vault_path.display()).dimmed());

    // Enter main menu
    main_menu(&mnemonic, &password, vault_path)?;

    Ok(())
}

fn import_wallet(vault_path: &PathBuf) -> anyhow::Result<()> {
    println!("\n{}", "Import from recovery phrase...".cyan());

    let phrase: String = Input::new()
        .with_prompt("Enter your 12 or 24 word recovery phrase")
        .interact_text()?;

    let mnemonic = Mnemonic::parse(&phrase)
        .map_err(|e| anyhow::anyhow!("Invalid mnemonic: {e}"))?;

    let password = Password::new()
        .with_prompt("Set a password to encrypt your wallet")
        .with_confirmation("Confirm password", "Passwords don't match")
        .interact()?;

    let encrypted = vault::encrypt_mnemonic(&mnemonic.to_string(), &password)?;
    vault::save_vault(&encrypted, vault_path)?;

    let kp = keypair::derive_keypair(&mnemonic, 0);
    println!("\n{}", "✓ Wallet imported and encrypted!".green().bold());
    println!("  Address: {}", kp.pubkey().to_string().white().bold());

    main_menu(&mnemonic, &password, vault_path)?;
    Ok(())
}

fn unlock_flow(vault_path: &PathBuf) -> anyhow::Result<()> {
    println!("{}", "Existing wallet found.".dimmed());

    let password = Password::new()
        .with_prompt("Enter your password")
        .interact()?;

    let encrypted = vault::load_vault(vault_path)?;
    let mnemonic_str = vault::decrypt_mnemonic(&encrypted, &password)?;
    let mnemonic = Mnemonic::parse(&mnemonic_str)
        .map_err(|e| anyhow::anyhow!("Corrupted wallet data: {e}"))?;

    println!("{}", "✓ Wallet unlocked!".green().bold());

    main_menu(&mnemonic, &password, vault_path)?;
    Ok(())
}

fn main_menu(mnemonic: &Mnemonic, _password: &str, _vault_path: &PathBuf) -> anyhow::Result<()> {
    let client = rpc::new_client(rpc::DEFAULT_RPC_URL);

    // Derive account(s)
    let kp = keypair::derive_keypair(mnemonic, 0);
    let address = kp.pubkey().to_string();

    loop {
        println!();
        println!("{}", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━".dimmed());

        // Fetch balance
        match rpc::get_balance(&client, &address) {
            Ok(balance) => {
                println!(
                    "  {} {} SOL",
                    "Balance:".cyan(),
                    format!("{balance:.9}").white().bold()
                );
            }
            Err(_) => {
                println!("  {} {}", "Balance:".cyan(), "(unable to fetch)".yellow());
            }
        }
        println!("  {} {}", "Address:".cyan(), rpc::format_address(&address).dimmed());
        println!("{}", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━".dimmed());

        let options = vec![
            "View Full Address",
            "Copy Address",
            "Send SOL",
            "Request Airdrop (Devnet)",
            "Refresh Balance",
            "Lock & Exit",
        ];

        let selection = Select::new()
            .with_prompt("Choose an action")
            .items(&options)
            .default(0)
            .interact()?;

        match selection {
            0 => {
                println!("\n  {}", address.white().bold());
            }
            1 => {
                println!("\n  {}", "Address printed above — copy it manually from the terminal.".dimmed());
                println!("  {}", address.white().bold());
            }
            2 => {
                // Send SOL
                let to_addr: String = Input::new()
                    .with_prompt("Recipient address")
                    .validate_with(|input: &String| {
                        if rpc::is_valid_address(input) {
                            Ok(())
                        } else {
                            Err("Invalid Solana address")
                        }
                    })
                    .interact_text()?;

                let amount: f64 = Input::new()
                    .with_prompt("Amount (SOL)")
                    .interact_text()?;

                println!("{}", "Sending transaction...".yellow());
                match transaction::send_sol(&client, &kp, &to_addr, amount) {
                    Ok(sig) => {
                        println!("{}", "✓ Transaction sent!".green().bold());
                        println!("  Signature: {}", sig.dimmed());
                    }
                    Err(e) => {
                        println!("{}", format!("✗ Failed: {e}").red());
                    }
                }
            }
            3 => {
                // Airdrop
                println!("{}", "Requesting 1 SOL airdrop...".yellow());
                match rpc::request_airdrop(&client, &address, 1.0) {
                    Ok(sig) => {
                        println!("{}", "✓ Airdrop received!".green().bold());
                        println!("  Signature: {}", sig.dimmed());
                    }
                    Err(e) => {
                        println!("{}", format!("✗ Airdrop failed: {e}").red());
                        println!("{}", "  (Devnet may be rate-limited)".dimmed());
                    }
                }
            }
            4 => {
                println!("{}", "Refreshing...".dimmed());
            }
            5 => {
                println!("\n{}", "🔒 Wallet locked. Goodbye!".purple());
                break;
            }
            _ => {}
        }
    }

    Ok(())
}
