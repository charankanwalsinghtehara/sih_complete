use std::collections::HashSet;

use crate::error::BlockchainError;
use crate::models::{genesis_block, Block, Transaction};

#[derive(Debug, Clone)]
pub struct Blockchain {
    chain: Vec<Block>,
    pending_transactions: Vec<Transaction>,
}

impl Blockchain {
    pub fn new() -> Self {
        Self {
            chain: vec![genesis_block()],
            pending_transactions: Vec::new(),
        }
    }

    pub fn from_chain(
        chain: Vec<Block>,
        pending_transactions: Vec<Transaction>,
    ) -> Result<Self, BlockchainError> {
        if chain.is_empty() {
            return Err(BlockchainError::EmptyLedger);
        }

        let blockchain = Self {
            chain,
            pending_transactions,
        };

        blockchain.validate()?;

        Ok(blockchain)
    }

    pub fn chain(&self) -> &[Block] {
        &self.chain
    }

    pub fn pending_transactions(&self) -> &[Transaction] {
        &self.pending_transactions
    }

    pub fn height(&self) -> u64 {
        self.chain.len() as u64
    }

    pub fn latest_block(&self) -> &Block {
        self.chain
            .last()
            .expect("blockchain must contain genesis block")
    }

    pub fn add_transaction(
        &mut self,
        transaction: Transaction,
    ) -> Result<(), BlockchainError> {
        transaction.validate()?;

        let exists_in_chain = self
            .chain
            .iter()
            .flat_map(|block| block.transactions.iter())
            .any(|tx| tx.transaction_id == transaction.transaction_id);

        let exists_pending = self
            .pending_transactions
            .iter()
            .any(|tx| tx.transaction_id == transaction.transaction_id);

        if exists_in_chain || exists_pending {
            return Err(BlockchainError::InvalidTransaction(
                "duplicate transaction ID".to_string(),
            ));
        }

        self.pending_transactions.push(transaction);

        Ok(())
    }

    pub fn create_block(
        &mut self,
        timestamp: u64,
    ) -> Result<Block, BlockchainError> {
        if self.pending_transactions.is_empty() {
            return Err(BlockchainError::InvalidBlock(
                "cannot create a block without transactions".to_string(),
            ));
        }

        let transactions =
            std::mem::take(&mut self.pending_transactions);

        let block = Block::new(
            self.latest_block().index + 1,
            timestamp,
            self.latest_block().hash.clone(),
            transactions,
        );

        block.validate()?;

        self.chain.push(block.clone());

        Ok(block)
    }

    pub fn replace_chain(
        &mut self,
        new_chain: Vec<Block>,
    ) -> Result<(), BlockchainError> {
        let candidate =
            Blockchain::from_chain(new_chain, Vec::new())?;

        if candidate.chain.len() < self.chain.len() {
            return Err(BlockchainError::InvalidChain(
                "replacement chain is shorter than local chain"
                    .to_string(),
            ));
        }

        self.chain = candidate.chain;

        Ok(())
    }

    pub fn validate(&self) -> Result<(), BlockchainError> {
        if self.chain.is_empty() {
            return Err(BlockchainError::EmptyLedger);
        }

        let genesis = &self.chain[0];

        if genesis.index != 0 {
            return Err(BlockchainError::InvalidChain(
                "first block must have index 0".to_string(),
            ));
        }

        genesis.validate()?;

        let mut transaction_ids = HashSet::new();

        for block in &self.chain {
            block.validate()?;

            for transaction in &block.transactions {
                if !transaction_ids.insert(
                    transaction.transaction_id.clone(),
                ) {
                    return Err(BlockchainError::InvalidChain(
                        "duplicate transaction detected".to_string(),
                    ));
                }
            }
        }

        for position in 1..self.chain.len() {
            let previous = &self.chain[position - 1];
            let current = &self.chain[position];

            if current.index != previous.index + 1 {
                return Err(BlockchainError::InvalidChain(format!(
                    "invalid block index at position {}",
                    position
                )));
            }

            if current.previous_hash != previous.hash {
                return Err(BlockchainError::InvalidChain(format!(
                    "block {} is not linked to previous block",
                    current.index
                )));
            }
        }

        for transaction in &self.pending_transactions {
            transaction.validate()?;

            if transaction_ids.contains(&transaction.transaction_id) {
                return Err(BlockchainError::InvalidChain(
                    "pending transaction already exists in chain"
                        .to_string(),
                ));
            }
        }

        Ok(())
    }
}

impl Default for Blockchain {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::sha256_hex;

    fn sample_transaction() -> Transaction {
        Transaction::new(
            sha256_hex(b"test document"),
            "WM-001".to_string(),
            "USER-001".to_string(),
            "ISSUE".to_string(),
        )
    }

    #[test]
    fn genesis_is_valid() {
        let blockchain = Blockchain::new();

        assert_eq!(blockchain.height(), 1);
        assert!(blockchain.validate().is_ok());
    }

    #[test]
    fn transaction_and_block_work() {
        let mut blockchain = Blockchain::new();

        blockchain
            .add_transaction(sample_transaction())
            .unwrap();

        let block = blockchain.create_block(100).unwrap();

        assert_eq!(block.index, 1);
        assert_eq!(block.transactions.len(), 1);
        assert_eq!(blockchain.height(), 2);

        assert!(blockchain.validate().is_ok());
    }

    #[test]
    fn empty_pool_cannot_create_block() {
        let mut blockchain = Blockchain::new();

        assert!(blockchain.create_block(100).is_err());
    }

    #[test]
    fn duplicate_transaction_is_rejected() {
        let mut blockchain = Blockchain::new();

        let tx = sample_transaction();

        blockchain.add_transaction(tx.clone()).unwrap();

        assert!(blockchain.add_transaction(tx).is_err());
    }

    #[test]
    fn tampering_is_detected() {
        let mut blockchain = Blockchain::new();

        blockchain
            .add_transaction(sample_transaction())
            .unwrap();

        blockchain.create_block(100).unwrap();

        blockchain.chain[1].transactions[0].action =
            "MODIFIED".to_string();

        assert!(blockchain.validate().is_err());
    }

    #[test]
    fn broken_link_is_detected() {
        let mut blockchain = Blockchain::new();

        blockchain
            .add_transaction(sample_transaction())
            .unwrap();

        blockchain.create_block(100).unwrap();

        blockchain.chain[1].previous_hash =
            "bad".to_string();

        assert!(blockchain.validate().is_err());
    }

    #[test]
    fn longer_valid_chain_can_replace_shorter_chain() {
        let mut local = Blockchain::new();

        let mut remote = Blockchain::new();

        remote
            .add_transaction(sample_transaction())
            .unwrap();

        remote.create_block(100).unwrap();

        assert!(local
            .replace_chain(remote.chain().to_vec())
            .is_ok());

        assert_eq!(local.height(), 2);
    }
}