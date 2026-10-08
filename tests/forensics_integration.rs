use securetrace_blockchain::{
    forensics::{
        ForensicVerifier,
        VerificationStatus,
    },
    models::sha256_hex,
    reed_solomon::{
        ReedSolomonConfig,
        ShardSet,
    },
    Blockchain,
    Transaction,
};

fn create_blockchain(
    document: &[u8],
) -> Blockchain {
    let mut blockchain =
        Blockchain::new();

    let transaction =
        Transaction::new(
            sha256_hex(document),
            "WM-INTEGRATION-001".to_string(),
            "RECIPIENT-001".to_string(),
            "ISSUE".to_string(),
        );

    blockchain
        .add_transaction(transaction)
        .unwrap();

    blockchain
        .create_block(100)
        .unwrap();

    blockchain
}

#[test]
fn original_document_is_verified() {
    let document =
        b"SecureTrace original evidence";

    let blockchain =
        create_blockchain(document);

    let verifier =
        ForensicVerifier::new(
            &blockchain
        );

    let result =
        verifier.verify_document(
            document,
            "WM-INTEGRATION-001",
        );

    assert_eq!(
        result.status,
        VerificationStatus::Verified
    );

    assert!(
        result.blockchain_valid
    );

    assert!(
        result.watermark_match
    );

    assert!(
        result.document_hash_match
    );
}

#[test]
fn modified_document_is_detected() {
    let original =
        b"SecureTrace original evidence";

    let modified =
        b"SecureTrace modified evidence";

    let blockchain =
        create_blockchain(original);

    let verifier =
        ForensicVerifier::new(
            &blockchain
        );

    let result =
        verifier.verify_document(
            modified,
            "WM-INTEGRATION-001",
        );

    assert_eq!(
        result.status,
        VerificationStatus::Modified
    );

    assert!(
        result.watermark_match
    );

    assert!(
        !result.document_hash_match
    );
}

#[test]
fn unknown_watermark_is_detected() {
    let document =
        b"SecureTrace evidence";

    let blockchain =
        create_blockchain(document);

    let verifier =
        ForensicVerifier::new(
            &blockchain
        );

    let result =
        verifier.verify_document(
            document,
            "UNKNOWN-WATERMARK",
        );

    assert_eq!(
        result.status,
        VerificationStatus::UnknownWatermark
    );
}

#[test]
fn lost_shard_can_be_recovered() {
    let document =
        b"SecureTrace distributed evidence";

    let config =
        ReedSolomonConfig::new(
            4,
            2,
        )
        .unwrap();

    let mut shards =
        ShardSet::encode(
            document,
            config,
        )
        .unwrap();

    shards
        .mark_missing(1)
        .unwrap();

    let recovered =
        shards
            .reconstruct()
            .unwrap();

    assert_eq!(
        recovered,
        document
    );
}

#[test]
fn recovered_document_can_be_verified() {
    let document =
        b"SecureTrace recoverable evidence";

    let blockchain =
        create_blockchain(document);

    let config =
        ReedSolomonConfig::new(
            4,
            2,
        )
        .unwrap();

    let mut shards =
        ShardSet::encode(
            document,
            config,
        )
        .unwrap();

    shards
        .mark_missing(2)
        .unwrap();

    let verifier =
        ForensicVerifier::new(
            &blockchain
        );

    let result =
        verifier.verify_recovered_document(
            &mut shards,
            "WM-INTEGRATION-001",
        );

    assert!(
        result.recovery_attempted
    );

    assert!(
        result.recovery_successful
    );

    assert_eq!(
        result.status,
        VerificationStatus::Verified
    );
}