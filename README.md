# WebWallet

A non-custodial Solana wallet built entirely in Rust. Manage keys, send SOL, and interact with the Solana blockchain from the command line.

## Features

- **Non-custodial** — your private keys never leave your machine
- **BIP39 mnemonic** — 24-word recovery phrase generation
- **Secure encryption** — AES-256-GCM with Argon2id key derivation
- **HD derivation** — SLIP-0010 ed25519 key derivation (m/44'/501'/n'/0')
- **SOL transfers** — send and receive SOL on devnet/mainnet
- **Airdrop** — request devnet SOL for testing
- **Interactive CLI** — beautiful terminal UI with `dialoguer`

## Architecture

```
crates/
├── wallet-core/    Library: key management, encryption, RPC, transactions
│   ├── keypair.rs      BIP39 mnemonic + SLIP-0010 derivation
│   ├── vault.rs        AES-256-GCM encrypted vault storage
│   ├── rpc.rs          Solana RPC client wrapper
│   └── transaction.rs  SOL transfer signing + submission
└── wallet-cli/     Binary: interactive CLI wallet
    └── main.rs         Create/import/unlock flows + main menu
```

## Quick Start

```bash
# Build
cargo build --release

# Run
cargo run --release

# Or run the binary directly
./target/release/webwallet
```

## Security Model

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Key Derivation | SLIP-0010 (HMAC-SHA512) | BIP39 → ed25519 keypair |
| Password KDF | Argon2id | Memory-hard password hashing |
| Encryption | AES-256-GCM | Authenticated encryption of mnemonic |
| Storage | `~/.webwallet/vault.json` | Encrypted vault file |

The mnemonic is never stored in plaintext. It's encrypted with a password-derived key and only held in memory while the wallet is unlocked.

## Usage

### Create a New Wallet
```
$ webwallet

╔══════════════════════════════════════╗
║       WebWallet — Solana Wallet       ║
║    Non-custodial • CLI • Rust-native  ║
╚══════════════════════════════════════╝

? No wallet found. What would you like to do?
> Create New Wallet
  Import from Mnemonic
  Exit
```

### Unlock & Interact
```
? Enter your password: ********
✓ Wallet unlocked!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Balance: 2.500000000 SOL
  Address: 7dGBRN...1K5v
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? Choose an action
> View Full Address
  Copy Address
  Send SOL
  Request Airdrop (Devnet)
  Refresh Balance
  Lock & Exit
```

## Testing

```bash
cargo test          # Unit tests (keypair derivation, vault crypto, RPC utils)
cargo clippy        # Lint check
```

## Dependencies

- `solana-sdk` / `solana-client` — Solana blockchain interaction
- `bip39` — Mnemonic phrase generation
- `ed25519-dalek` — Ed25519 signing
- `aes-gcm` — Authenticated encryption
- `argon2` — Password-based key derivation
- `dialoguer` — Interactive terminal prompts
- `colored` — Terminal colors

## License

MIT
