use std::thread;
use std::time::Duration;

use securetrace_blockchain::{
    models::sha256_hex,
    network::{
        ask_node_to_validate,
        ping_node,
        request_chain,
        NetworkNode,
    },
    Blockchain,
    Transaction,
};

fn create_node(
    node_id: &str,
    port: u16,
) -> NetworkNode {
    NetworkNode::new(
        node_id.to_string(),
        format!("127.0.0.1:{}", port),
        Blockchain::new(),
    )
}

#[test]
fn three_nodes_can_start_and_ping() {
    let node1 =
        create_node("test-node-1", 7101);

    let node2 =
        create_node("test-node-2", 7102);

    let node3 =
        create_node("test-node-3", 7103);

    node1.start().unwrap();
    node2.start().unwrap();
    node3.start().unwrap();

    thread::sleep(Duration::from_millis(300));

    assert!(
        ping_node("127.0.0.1:7101").unwrap()
    );

    assert!(
        ping_node("127.0.0.1:7102").unwrap()
    );

    assert!(
        ping_node("127.0.0.1:7103").unwrap()
    );
}

#[test]
fn nodes_return_valid_genesis_chain() {
    let node =
        create_node("chain-node", 7104);

    node.start().unwrap();

    thread::sleep(Duration::from_millis(200));

    let chain =
        request_chain("127.0.0.1:7104")
            .unwrap();

    assert_eq!(chain.len(), 1);

    assert_eq!(chain[0].index, 0);

    assert_eq!(
        chain[0].previous_hash,
        "0"
    );
}

#[test]
fn node_can_validate_valid_chain() {
    let node =
        create_node("validation-node", 7105);

    node.start().unwrap();

    thread::sleep(Duration::from_millis(200));

    let mut blockchain =
        Blockchain::new();

    blockchain
        .add_transaction(
            Transaction::new(
                sha256_hex(b"network document"),
                "WM-NET-001".to_string(),
                "USER-NET-001".to_string(),
                "ISSUE".to_string(),
            ),
        )
        .unwrap();

    blockchain
        .create_block(100)
        .unwrap();

    let result =
        ask_node_to_validate(
            "127.0.0.1:7105",
            blockchain.chain().to_vec(),
        )
        .unwrap();

    assert!(result.1);
    assert_eq!(result.2, 2);
}

#[test]
fn node_rejects_invalid_chain() {
    let node =
        create_node("reject-node", 7106);

    node.start().unwrap();

    thread::sleep(Duration::from_millis(200));

    let mut blockchain =
        Blockchain::new();

    blockchain
        .add_transaction(
            Transaction::new(
                sha256_hex(b"document"),
                "WM-REJECT".to_string(),
                "USER-REJECT".to_string(),
                "ISSUE".to_string(),
            ),
        )
        .unwrap();

    blockchain
        .create_block(100)
        .unwrap();

    let mut chain =
        blockchain.chain().to_vec();

    chain[1].previous_hash =
        "invalid".to_string();

    let result =
        ask_node_to_validate(
            "127.0.0.1:7106",
            chain,
        )
        .unwrap();

    assert!(!result.1);
}