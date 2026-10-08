use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::error::BlockchainError;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Transaction {
    pub transaction_id: String,
    pub document_hash: String,
    pub watermark_id: String,
    pub recipient_id: String,
    pub action: String,
}

impl Transaction {
    pub fn new(
        document_hash: String,
        watermark_id: String,
        recipient_id: String,
        action: String,
    ) -> Self {
        let seed = format!(
            "{}|{}|{}|{}",
            document_hash,
            watermark_id,
            recipient_id,
            action
        );

        let transaction_id = sha256_hex(seed.as_bytes());

        Self {
            transaction_id,
            document_hash,
            watermark_id,
            recipient_id,
            action,
        }
    }

    pub fn with_id(
        transaction_id: String,
        document_hash: String,
        watermark_id: String,
        recipient_id: String,
        action: String,
    ) -> Self {
        Self {
            transaction_id,
            document_hash,
            watermark_id,
            recipient_id,
            action,
        }
    }

    pub fn validate(&self) -> Result<(), BlockchainError> {
        if self.transaction_id.trim().is_empty() {
            return Err(BlockchainError::InvalidTransaction(
                "transaction ID cannot be empty".to_string(),
            ));
        }

        if self.transaction_id.len() != 64
            || !self
                .transaction_id
                .chars()
                .all(|c| c.is_ascii_hexdigit())
        {
            return Err(BlockchainError::InvalidTransaction(
                "transaction ID must be a SHA-256 hexadecimal value".to_string(),
            ));
        }

        if self.document_hash.len() != 64 {
            return Err(BlockchainError::InvalidTransaction(
                "document hash must be a SHA-256 hash".to_string(),
            ));
        }

        if !self
            .document_hash
            .chars()
            .all(|c| c.is_ascii_hexdigit())
        {
            return Err(BlockchainError::InvalidTransaction(
                "document hash contains invalid hexadecimal characters"
                    .to_string(),
            ));
        }

        if self.watermark_id.trim().is_empty() {
            return Err(BlockchainError::InvalidTransaction(
                "watermark ID cannot be empty".to_string(),
            ));
        }

        if self.recipient_id.trim().is_empty() {
            return Err(BlockchainError::InvalidTransaction(
                "recipient ID cannot be empty".to_string(),
            ));
        }

        if self.action.trim().is_empty() {
            return Err(BlockchainError::InvalidTransaction(
                "action cannot be empty".to_string(),
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Block {
    pub index: u64,
    pub timestamp: u64,
    pub previous_hash: String,
    pub transactions: Vec<Transaction>,
    pub hash: String,
}

impl Block {
    pub fn new(
        index: u64,
        timestamp: u64,
        previous_hash: String,
        transactions: Vec<Transaction>,
    ) -> Self {
        let mut block = Self {
            index,
            timestamp,
            previous_hash,
            transactions,
            hash: String::new(),
        };

        block.hash = block.calculate_hash();

        block
    }

    pub fn calculate_hash(&self) -> String {
        let content = (
            self.index,
            self.timestamp,
            &self.previous_hash,
            &self.transactions,
        );

        let serialized =
            serde_json::to_vec(&content).expect("block serialization failed");

        sha256_hex(&serialized)
    }

    pub fn validate(&self) -> Result<(), BlockchainError> {
        if self.hash != self.calculate_hash() {
            return Err(BlockchainError::InvalidBlock(format!(
                "block {} hash does not match its contents",
                self.index
            )));
        }

        for transaction in &self.transactions {
            transaction.validate()?;
        }

        if self.index == 0 {
            if self.previous_hash != "0" {
                return Err(BlockchainError::InvalidBlock(
                    "genesis block must have previous hash 0".to_string(),
                ));
            }

            if !self.transactions.is_empty() {
                return Err(BlockchainError::InvalidBlock(
                    "genesis block cannot contain transactions".to_string(),
                ));
            }
        } else if self.previous_hash.len() != 64
            || !self
                .previous_hash
                .chars()
                .all(|c| c.is_ascii_hexdigit())
        {
            return Err(BlockchainError::InvalidBlock(format!(
                "block {} has an invalid previous hash",
                self.index
            )));
        }

        if self.index > 0 && self.transactions.is_empty() {
            return Err(BlockchainError::InvalidBlock(format!(
                "block {} cannot be empty",
                self.index
            )));
        }

        Ok(())
    }
}

pub fn genesis_block() -> Block {
    Block::new(0, 0, "0".to_string(), Vec::new())
}

pub fn sha256_hex(data: &[u8]) -> String {
    let mut hasher = Sha256::new();

    hasher.update(data);

    hex::encode(hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sha256_is_64_hex_characters() {
        let hash = sha256_hex(b"SecureTrace");

        assert_eq!(hash.len(), 64);
        assert!(hash.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn transaction_is_valid() {
        let transaction = Transaction::new(
            sha256_hex(b"document"),
            "WM-001".to_string(),
            "USER-001".to_string(),
            "ISSUE".to_string(),
        );

        assert!(transaction.validate().is_ok());
    }

    #[test]
    fn genesis_is_valid() {
        let block = genesis_block();

        assert!(block.validate().is_ok());
        assert_eq!(block.index, 0);
        assert_eq!(block.previous_hash, "0");
    }

    #[test]
    fn transaction_id_is_deterministic() {
        let hash = sha256_hex(b"document");

        let first = Transaction::new(
            hash.clone(),
            "WM-001".to_string(),
            "USER-001".to_string(),
            "ISSUE".to_string(),
        );

        let second = Transaction::new(
            hash,
            "WM-001".to_string(),
            "USER-001".to_string(),
            "ISSUE".to_string(),
        );

        assert_eq!(first.transaction_id, second.transaction_id);
    }
}