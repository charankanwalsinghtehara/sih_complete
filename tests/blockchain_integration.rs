use securetrace_blockchain::{
    models::sha256_hex,
    Blockchain,
    LedgerStorage,
    Transaction,
};

#[test]
fn complete_document_issue_flow() {
    let mut blockchain = Blockchain::new();

    let document_hash =
        sha256_hex(b"confidential document");

    let transaction = Transaction::new(
        document_hash,
        "WM-1001".to_string(),
        "RECIPIENT-1001".to_string(),
        "ISSUE".to_string(),
    );

    blockchain
        .add_transaction(transaction)
        .unwrap();

    let block =
        blockchain.create_block(1000).unwrap();

    assert_eq!(block.index, 1);
    assert_eq!(block.transactions.len(), 1);

    assert!(blockchain.validate().is_ok());
}

#[test]
fn persistence_preserves_blockchain() {
    let directory =
        tempfile::tempdir().unwrap();

    let path =
        directory.path().join("ledger.json");

    let storage =
        LedgerStorage::new(&path);

    let mut blockchain =
        Blockchain::new();

    blockchain
        .add_transaction(Transaction::new(
            sha256_hex(b"document"),
            "WM-2001".to_string(),
            "RECIPIENT-2001".to_string(),
            "ISSUE".to_string(),
        ))
        .unwrap();

    blockchain.create_block(2000).unwrap();

    storage.save(&blockchain).unwrap();

    let loaded =
        storage.load().unwrap();

    assert_eq!(
        loaded.chain()[1].hash,
        blockchain.chain()[1].hash
    );

    assert!(loaded.validate().is_ok());
}

#[test]
fn modified_ledger_is_rejected() {
    let directory =
        tempfile::tempdir().unwrap();

    let path =
        directory.path().join("ledger.json");

    let storage =
        LedgerStorage::new(&path);

    let mut blockchain =
        Blockchain::new();

    blockchain
        .add_transaction(Transaction::new(
            sha256_hex(b"document"),
            "WM-3001".to_string(),
            "RECIPIENT-3001".to_string(),
            "ISSUE".to_string(),
        ))
        .unwrap();

    blockchain.create_block(3000).unwrap();

    storage.save(&blockchain).unwrap();

    let mut content =
        std::fs::read_to_string(&path)
            .unwrap();

    content =
        content.replace("ISSUE", "MODIFIED");

    std::fs::write(&path, content)
        .unwrap();

    let result = storage.load();

    assert!(result.is_err());
}