use serde::{Deserialize, Serialize};

use crate::blockchain::Blockchain;
use crate::models::{sha256_hex, Transaction};
use crate::reed_solomon::ShardSet;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum VerificationStatus {
    Verified,
    Modified,
    UnknownWatermark,
    InvalidBlockchain,
    RecoveryFailed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForensicResult {
    pub status: VerificationStatus,

    pub watermark_found: bool,
    pub watermark_match: bool,

    pub document_hash_match: bool,
    pub blockchain_valid: bool,

    pub recovery_attempted: bool,
    pub recovery_successful: bool,

    pub matched_transaction_id: Option<String>,
    pub matched_recipient_id: Option<String>,

    pub calculated_hash: String,
    pub recorded_hash: Option<String>,

    pub message: String,
}

impl ForensicResult {
    pub fn verified(
        transaction: &Transaction,
        calculated_hash: String,
    ) -> Self {
        Self {
            status: VerificationStatus::Verified,

            watermark_found: true,
            watermark_match: true,

            document_hash_match: true,
            blockchain_valid: true,

            recovery_attempted: false,
            recovery_successful: false,

            matched_transaction_id:
                Some(transaction.transaction_id.clone()),

            matched_recipient_id:
                Some(transaction.recipient_id.clone()),

            calculated_hash,

            recorded_hash:
                Some(transaction.document_hash.clone()),

            message:
                "document matches the issued blockchain record"
                    .to_string(),
        }
    }
}

pub struct ForensicVerifier<'a> {
    blockchain: &'a Blockchain,
}

impl<'a> ForensicVerifier<'a> {
    pub fn new(
        blockchain: &'a Blockchain,
    ) -> Self {
        Self { blockchain }
    }

    pub fn verify_document(
        &self,
        document: &[u8],
        watermark_id: &str,
    ) -> ForensicResult {
        let calculated_hash =
            sha256_hex(document);

        let blockchain_valid =
            self.blockchain.validate().is_ok();

        if !blockchain_valid {
            return ForensicResult {
                status:
                    VerificationStatus::InvalidBlockchain,

                watermark_found: false,
                watermark_match: false,

                document_hash_match: false,
                blockchain_valid: false,

                recovery_attempted: false,
                recovery_successful: false,

                matched_transaction_id: None,
                matched_recipient_id: None,

                calculated_hash,

                recorded_hash: None,

                message:
                    "blockchain validation failed"
                        .to_string(),
            };
        }

        let transaction =
            self.find_transaction(watermark_id);

        let transaction =
            match transaction {
                Some(transaction) => transaction,

                None => {
                    return ForensicResult {
                        status:
                            VerificationStatus::UnknownWatermark,

                        watermark_found: false,
                        watermark_match: false,

                        document_hash_match: false,
                        blockchain_valid: true,

                        recovery_attempted: false,
                        recovery_successful: false,

                        matched_transaction_id: None,
                        matched_recipient_id: None,

                        calculated_hash,

                        recorded_hash: None,

                        message:
                            "watermark was not found in blockchain"
                                .to_string(),
                    }
                }
            };

        if transaction.document_hash
            == calculated_hash
        {
            return ForensicResult::verified(
                transaction,
                calculated_hash,
            );
        }

        ForensicResult {
            status:
                VerificationStatus::Modified,

            watermark_found: true,
            watermark_match: true,

            document_hash_match: false,
            blockchain_valid: true,

            recovery_attempted: false,
            recovery_successful: false,

            matched_transaction_id:
                Some(transaction.transaction_id.clone()),

            matched_recipient_id:
                Some(transaction.recipient_id.clone()),

            calculated_hash,

            recorded_hash:
                Some(transaction.document_hash.clone()),

            message:
                "watermark matches an issued copy, but document hash differs"
                    .to_string(),
        }
    }

    pub fn verify_recovered_document(
        &self,
        shards: &mut ShardSet,
        watermark_id: &str,
    ) -> ForensicResult {
        let recovery_attempted = true;

        let recovered =
            shards.reconstruct();

        match recovered {
            Ok(document) => {
                let mut result =
                    self.verify_document(
                        &document,
                        watermark_id,
                    );

                result.recovery_attempted =
                    recovery_attempted;

                result.recovery_successful =
                    true;

                result
            }

            Err(error) => ForensicResult {
                status:
                    VerificationStatus::RecoveryFailed,

                watermark_found: false,
                watermark_match: false,

                document_hash_match: false,
                blockchain_valid:
                    self.blockchain.validate().is_ok(),

                recovery_attempted,

                recovery_successful: false,

                matched_transaction_id: None,
                matched_recipient_id: None,

                calculated_hash: String::new(),

                recorded_hash: None,

                message: format!(
                    "evidence recovery failed: {}",
                    error
                ),
            },
        }
    }

    fn find_transaction(
        &self,
        watermark_id: &str,
    ) -> Option<&Transaction> {
        self.blockchain
            .chain()
            .iter()
            .flat_map(|block| {
                block.transactions.iter()
            })
            .find(|transaction| {
                transaction.watermark_id
                    == watermark_id
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::sha256_hex;

    fn blockchain_with_document(
        document: &[u8],
    ) -> Blockchain {
        let mut blockchain =
            Blockchain::new();

        let transaction =
            Transaction::new(
                sha256_hex(document),
                "WM-FORENSIC-001".to_string(),
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
    fn identical_document_is_verified() {
        let document =
            b"confidential SecureTrace document";

        let blockchain =
            blockchain_with_document(document);

        let verifier =
            ForensicVerifier::new(
                &blockchain
            );

        let result =
            verifier.verify_document(
                document,
                "WM-FORENSIC-001",
            );

        assert_eq!(
            result.status,
            VerificationStatus::Verified
        );

        assert!(result.watermark_match);
        assert!(result.document_hash_match);
        assert!(result.blockchain_valid);
    }

    #[test]
    fn modified_document_is_detected() {
        let original =
            b"original document";

        let modified =
            b"modified document";

        let blockchain =
            blockchain_with_document(original);

        let verifier =
            ForensicVerifier::new(
                &blockchain
            );

        let result =
            verifier.verify_document(
                modified,
                "WM-FORENSIC-001",
            );

        assert_eq!(
            result.status,
            VerificationStatus::Modified
        );

        assert!(result.watermark_match);
        assert!(!result.document_hash_match);
    }

    #[test]
    fn unknown_watermark_is_detected() {
        let blockchain =
            blockchain_with_document(
                b"document",
            );

        let verifier =
            ForensicVerifier::new(
                &blockchain
            );

        let result =
            verifier.verify_document(
                b"document",
                "UNKNOWN",
            );

        assert_eq!(
            result.status,
            VerificationStatus::UnknownWatermark
        );
    }

    #[test]
    fn recovery_verification_works() {
        let document =
            b"Recoverable evidence document";

        let blockchain =
            blockchain_with_document(document);

        let config =
            crate::reed_solomon::ReedSolomonConfig::new(
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

        shards.mark_missing(1).unwrap();

        let verifier =
            ForensicVerifier::new(
                &blockchain
            );

        let result =
            verifier.verify_recovered_document(
                &mut shards,
                "WM-FORENSIC-001",
            );

        assert!(
            result.recovery_attempted
        );

        assert!(
            result.recovery_successful
        );
    }
}