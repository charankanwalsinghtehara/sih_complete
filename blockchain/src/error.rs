use thiserror::Error;

#[derive(Debug, Error)]
pub enum BlockchainError {
    #[error("invalid transaction: {0}")]
    InvalidTransaction(String),

    #[error("invalid block: {0}")]
    InvalidBlock(String),

    #[error("invalid blockchain: {0}")]
    InvalidChain(String),

    #[error("network error: {0}")]
    Network(String),

    #[error("storage error: {0}")]
    Storage(#[from] std::io::Error),

    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("ledger is empty")]
    EmptyLedger,
}