use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::blockchain::Blockchain;
use crate::error::BlockchainError;
use crate::models::{Block, Transaction};

#[derive(Debug, Serialize, Deserialize)]
struct LedgerFile {
    version: u32,
    chain: Vec<Block>,
    pending_transactions: Vec<Transaction>,
}

pub struct LedgerStorage {
    path: PathBuf,
}

impl LedgerStorage {
    pub fn new<P: AsRef<Path>>(path: P) -> Self {
        Self {
            path: path.as_ref().to_path_buf(),
        }
    }

    pub fn save(
        &self,
        blockchain: &Blockchain,
    ) -> Result<(), BlockchainError> {
        blockchain.validate()?;

        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)?;
        }

        let ledger = LedgerFile {
            version: 1,
            chain: blockchain.chain().to_vec(),
            pending_transactions: blockchain
                .pending_transactions()
                .to_vec(),
        };

        let json = serde_json::to_string_pretty(&ledger)?;

        let temp_path = self.path.with_extension("tmp");

        fs::write(&temp_path, json)?;

        if self.path.exists() {
            fs::remove_file(&self.path)?;
        }

        fs::rename(&temp_path, &self.path)?;

        Ok(())
    }

    pub fn load(&self) -> Result<Blockchain, BlockchainError> {
        if !self.path.exists() {
            return Err(BlockchainError::Storage(
                std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "ledger file does not exist",
                ),
            ));
        }

        let data = fs::read_to_string(&self.path)?;

        let ledger: LedgerFile =
            serde_json::from_str(&data)?;

        if ledger.version != 1 {
            return Err(BlockchainError::InvalidChain(
                "unsupported ledger version".to_string(),
            ));
        }

        Blockchain::from_chain(
            ledger.chain,
            ledger.pending_transactions,
        )
    }

    pub fn load_or_create(
        &self,
    ) -> Result<Blockchain, BlockchainError> {
        if self.path.exists() {
            self.load()
        } else {
            let blockchain = Blockchain::new();

            self.save(&blockchain)?;

            Ok(blockchain)
        }
    }

    pub fn reset(
        &self,
    ) -> Result<Blockchain, BlockchainError> {
        let blockchain = Blockchain::new();

        self.save(&blockchain)?;

        Ok(blockchain)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{sha256_hex, Transaction};

    #[test]
    fn save_and_load() {
        let directory = tempfile::tempdir().unwrap();

        let path = directory.path().join("ledger.json");

        let storage = LedgerStorage::new(&path);

        let mut blockchain = Blockchain::new();

        blockchain
            .add_transaction(Transaction::new(
                sha256_hex(b"document"),
                "WM-001".to_string(),
                "USER-001".to_string(),
                "ISSUE".to_string(),
            ))
            .unwrap();

        blockchain.create_block(100).unwrap();

        storage.save(&blockchain).unwrap();

        let loaded = storage.load().unwrap();

        assert_eq!(loaded.height(), 2);
        assert!(loaded.validate().is_ok());
    }

    #[test]
    fn load_or_create_creates_ledger() {
        let directory = tempfile::tempdir().unwrap();

        let path = directory.path().join("ledger.json");

        let storage = LedgerStorage::new(&path);

        let blockchain = storage.load_or_create().unwrap();

        assert_eq!(blockchain.height(), 1);
        assert!(path.exists());
    }
}