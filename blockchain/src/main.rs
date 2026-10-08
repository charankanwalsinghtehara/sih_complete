use std::path::PathBuf;
use std::thread;
use std::time::Duration;

use securetrace_blockchain::{
    forensics::ForensicVerifier,
    models::sha256_hex,
    network::{
        consensus_validate,
        ping_node,
        request_chain,
        NetworkNode,
    },
    reed_solomon::{
        ReedSolomonConfig,
        ShardSet,
    },
    Blockchain,
    LedgerStorage,
    Transaction,
};

fn ledger_path() -> PathBuf {
    PathBuf::from("../data/ledger.json")
}

fn node_ledger_path(
    node_id: &str,
) -> PathBuf {
    PathBuf::from(format!(
        "../data/{}.json",
        node_id
    ))
}

fn demo() -> Result<(), Box<dyn std::error::Error>> {
    let storage =
        LedgerStorage::new(
            ledger_path()
        );

    let mut blockchain =
        storage.reset()?;

    let document_hash =
        sha256_hex(
            b"SecureTrace Module 2 document",
        );

    let transaction =
        Transaction::new(
            document_hash,
            "WM-DEMO-001".to_string(),
            "RECIPIENT-001".to_string(),
            "ISSUE".to_string(),
        );

    blockchain
        .add_transaction(transaction)?;

    let block =
        blockchain.create_block(1)?;

    println!(
        "Block created: {}",
        block.hash
    );

    storage.save(
        &blockchain
    )?;

    println!(
        "Blockchain height: {}",
        blockchain.height()
    );

    Ok(())
}

fn validate()
    -> Result<(), Box<dyn std::error::Error>>
{
    let storage =
        LedgerStorage::new(
            ledger_path()
        );

    let blockchain =
        storage.load()?;

    blockchain.validate()?;

    println!(
        "Blockchain is VALID."
    );

    println!(
        "Height: {}",
        blockchain.height()
    );

    Ok(())
}

fn print_ledger()
    -> Result<(), Box<dyn std::error::Error>>
{
    let storage =
        LedgerStorage::new(
            ledger_path()
        );

    let blockchain =
        storage.load()?;

    println!(
        "{}",
        serde_json::to_string_pretty(
            blockchain.chain()
        )?
    );

    Ok(())
}

fn reset()
    -> Result<(), Box<dyn std::error::Error>>
{
    let storage =
        LedgerStorage::new(
            ledger_path()
        );

    let blockchain =
        storage.reset()?;

    println!(
        "Ledger reset."
    );

    println!(
        "Height: {}",
        blockchain.height()
    );

    Ok(())
}

fn start_node(
    node_id: &str,
    address: &str,
) -> Result<(), Box<dyn std::error::Error>>
{
    let storage =
        LedgerStorage::new(
            node_ledger_path(node_id)
        );

    let blockchain =
        storage.load_or_create()?;

    blockchain.validate()?;

    let node =
        NetworkNode::new(
            node_id.to_string(),
            address.to_string(),
            blockchain,
        );

    node.start()?;

    println!(
        "{} running on {}",
        node_id,
        address
    );

    loop {
        thread::sleep(
            Duration::from_secs(60)
        );
    }
}

fn network_status()
    -> Result<(), Box<dyn std::error::Error>>
{
    let addresses = [
        "127.0.0.1:7001",
        "127.0.0.1:7002",
        "127.0.0.1:7003",
    ];

    for address in addresses {
        match ping_node(address) {
            Ok(true) => {
                println!(
                    "{} -> ONLINE",
                    address
                );
            }

            _ => {
                println!(
                    "{} -> OFFLINE",
                    address
                );
            }
        }
    }

    Ok(())
}

fn network_chains()
    -> Result<(), Box<dyn std::error::Error>>
{
    let addresses = [
        "127.0.0.1:7001",
        "127.0.0.1:7002",
        "127.0.0.1:7003",
    ];

    for address in addresses {
        match request_chain(address) {
            Ok(chain) => {
                println!(
                    "{} -> {} blocks",
                    address,
                    chain.len()
                );
            }

            Err(error) => {
                println!(
                    "{} -> ERROR: {}",
                    address,
                    error
                );
            }
        }
    }

    Ok(())
}

fn consensus()
    -> Result<(), Box<dyn std::error::Error>>
{
    let addresses = vec![
        "127.0.0.1:7001".to_string(),
        "127.0.0.1:7002".to_string(),
        "127.0.0.1:7003".to_string(),
    ];

    let chain =
        request_chain(
            &addresses[0]
        )?;

    let accepted =
        consensus_validate(
            &addresses,
            chain,
        )?;

    println!(
        "2-of-3 consensus: {}",
        if accepted {
            "ACCEPTED"
        } else {
            "REJECTED"
        }
    );

    Ok(())
}

fn m5_demo()
    -> Result<(), Box<dyn std::error::Error>>
{
    let document =
        b"SecureTrace forensic evidence";

    let config =
        ReedSolomonConfig::new(
            4,
            2,
        )?;

    let mut shard_set =
        ShardSet::encode(
            document,
            config,
        )?;

    println!(
        "Original size: {} bytes",
        shard_set.original_size
    );

    println!(
        "Total shards: {}",
        shard_set.shards.len()
    );

    println!(
        "Available shards: {}",
        shard_set.available_count()
    );

    shard_set.mark_missing(1)?;

    println!(
        "After loss: {} shards",
        shard_set.available_count()
    );

    let recovered =
        shard_set.reconstruct()?;

    println!(
        "Recovered: {}",
        String::from_utf8_lossy(
            &recovered
        )
    );

    println!(
        "Recovery successful: {}",
        recovered == document
    );

    Ok(())
}

fn m6_demo()
    -> Result<(), Box<dyn std::error::Error>>
{
    let document =
        b"SecureTrace confidential evidence";

    let mut blockchain =
        Blockchain::new();

    let transaction =
        Transaction::new(
            sha256_hex(document),
            "WM-FORENSIC-001".to_string(),
            "RECIPIENT-FORENSIC-001"
                .to_string(),
            "ISSUE".to_string(),
        );

    blockchain
        .add_transaction(
            transaction
        )?;

    blockchain
        .create_block(100)?;

    let verifier =
        ForensicVerifier::new(
            &blockchain
        );

    let result =
        verifier.verify_document(
            document,
            "WM-FORENSIC-001",
        );

    println!(
        "FORENSIC VERIFICATION"
    );

    println!(
        "Status: {:?}",
        result.status
    );

    println!(
        "Watermark: {}",
        if result.watermark_match {
            "MATCH"
        } else {
            "NO MATCH"
        }
    );

    println!(
        "Document hash: {}",
        if result.document_hash_match {
            "MATCH"
        } else {
            "MISMATCH"
        }
    );

    println!(
        "Blockchain: {}",
        if result.blockchain_valid {
            "VALID"
        } else {
            "INVALID"
        }
    );

    println!(
        "Message: {}",
        result.message
    );

    Ok(())
}

fn m6_modified_demo()
    -> Result<(), Box<dyn std::error::Error>>
{
    let original =
        b"Original SecureTrace document";

    let modified =
        b"Modified SecureTrace document";

    let mut blockchain =
        Blockchain::new();

    let transaction =
        Transaction::new(
            sha256_hex(original),
            "WM-MODIFIED-001".to_string(),
            "RECIPIENT-001".to_string(),
            "ISSUE".to_string(),
        );

    blockchain
        .add_transaction(
            transaction
        )?;

    blockchain
        .create_block(100)?;

    let verifier =
        ForensicVerifier::new(
            &blockchain
        );

    let result =
        verifier.verify_document(
            modified,
            "WM-MODIFIED-001",
        );

    println!(
        "FORENSIC VERIFICATION"
    );

    println!(
        "Status: {:?}",
        result.status
    );

    println!(
        "Watermark: {}",
        if result.watermark_match {
            "MATCH"
        } else {
            "NO MATCH"
        }
    );

    println!(
        "Document hash: {}",
        if result.document_hash_match {
            "MATCH"
        } else {
            "MISMATCH"
        }
    );

    println!(
        "Blockchain: {}",
        if result.blockchain_valid {
            "VALID"
        } else {
            "INVALID"
        }
    );

    println!(
        "Message: {}",
        result.message
    );

    Ok(())
}

fn print_help() {
    println!("SecureTrace Blockchain");
    println!();
    println!("M3:");
    println!("  demo");
    println!("  validate");
    println!("  print");
    println!("  reset");
    println!();
    println!("M4:");
    println!("  node1");
    println!("  node2");
    println!("  node3");
    println!("  network-status");
    println!("  network-chains");
    println!("  consensus");
    println!();
    println!("M5:");
    println!("  m5-demo");
    println!();
    println!("M6:");
    println!("  m6-demo");
    println!("  m6-modified");
}

fn main() {
    let command =
        std::env::args()
            .nth(1)
            .unwrap_or_else(
                || "demo".to_string()
            );

    let result =
        match command.as_str() {
            "demo" => demo(),

            "validate" =>
                validate(),

            "print" =>
                print_ledger(),

            "reset" =>
                reset(),

            "node1" =>
                start_node(
                    "node1",
                    "127.0.0.1:7001",
                ),

            "node2" =>
                start_node(
                    "node2",
                    "127.0.0.1:7002",
                ),

            "node3" =>
                start_node(
                    "node3",
                    "127.0.0.1:7003",
                ),

            "network-status" =>
                network_status(),

            "network-chains" =>
                network_chains(),

            "consensus" =>
                consensus(),

            "m5-demo" =>
                m5_demo(),

            "m6-demo" =>
                m6_demo(),

            "m6-modified" =>
                m6_modified_demo(),

            "help" => {
                print_help();
                Ok(())
            }

            _ => {
                print_help();
                Ok(())
            }
        };

    if let Err(error) = result {
        eprintln!(
            "ERROR: {}",
            error
        );

        std::process::exit(1);
    }
}