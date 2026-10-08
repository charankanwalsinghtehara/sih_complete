use std::io::{BufRead, BufReader, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::{Arc, Mutex};
use std::thread;

use serde::{Deserialize, Serialize};

use crate::blockchain::Blockchain;
use crate::error::BlockchainError;
use crate::models::Block;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkMessage {
    Ping,

    GetChain,

    ChainResponse(Vec<Block>),

    ValidateChain(Vec<Block>),

    ValidationResponse {
        node_id: String,
        valid: bool,
        height: u64,
    },

    ProposeBlock(Block),

    ProposalResponse {
        node_id: String,
        accepted: bool,
    },
}

fn send_message(
    stream: &mut TcpStream,
    message: &NetworkMessage,
) -> Result<(), BlockchainError> {
    let json =
        serde_json::to_string(message)?;

    stream.write_all(
        json.as_bytes()
    )?;

    stream.write_all(b"\n")?;

    stream.flush()?;

    Ok(())
}

fn receive_message(
    stream: &TcpStream,
) -> Result<NetworkMessage, BlockchainError> {
    let mut reader =
        BufReader::new(
            stream.try_clone()?
        );

    let mut line =
        String::new();

    reader.read_line(
        &mut line
    )?;

    if line.trim().is_empty() {
        return Err(
            BlockchainError::Network(
                "empty network message"
                    .to_string(),
            ),
        );
    }

    Ok(
        serde_json::from_str(
            line.trim()
        )?
    )
}

pub struct NetworkNode {
    pub node_id: String,

    pub address: String,

    blockchain:
        Arc<Mutex<Blockchain>>,
}

impl NetworkNode {
    pub fn new(
        node_id: String,
        address: String,
        blockchain: Blockchain,
    ) -> Self {
        Self {
            node_id,
            address,
            blockchain:
                Arc::new(
                    Mutex::new(
                        blockchain
                    )
                ),
        }
    }

    pub fn blockchain(
        &self,
    ) -> Arc<Mutex<Blockchain>> {
        Arc::clone(
            &self.blockchain
        )
    }

    pub fn start(
        &self,
    ) -> Result<(), BlockchainError> {
        let listener =
            TcpListener::bind(
                &self.address
            )?;

        println!(
            "[{}] listening on {}",
            self.node_id,
            self.address
        );

        let node_id =
            self.node_id.clone();

        let blockchain =
            Arc::clone(
                &self.blockchain
            );

        thread::spawn(
            move || {
                for stream
                    in listener.incoming()
                {
                    match stream {
                        Ok(stream) => {
                            let node_id =
                                node_id.clone();

                            let blockchain =
                                Arc::clone(
                                    &blockchain
                                );

                            thread::spawn(
                                move || {
                                    if let Err(error) =
                                        handle_connection(
                                            stream,
                                            node_id,
                                            blockchain,
                                        )
                                    {
                                        eprintln!(
                                            "network error: {}",
                                            error
                                        );
                                    }
                                }
                            );
                        }

                        Err(error) => {
                            eprintln!(
                                "connection error: {}",
                                error
                            );
                        }
                    }
                }
            }
        );

        Ok(())
    }
}

fn handle_connection(
    mut stream: TcpStream,
    node_id: String,
    blockchain: Arc<Mutex<Blockchain>>,
) -> Result<(), BlockchainError> {
    let message =
        receive_message(
            &stream
        )?;

    match message {
        NetworkMessage::Ping => {
            send_message(
                &mut stream,
                &NetworkMessage::Ping,
            )?;
        }

        NetworkMessage::GetChain => {
            let chain = {
                let blockchain =
                    blockchain
                        .lock()
                        .map_err(|_| {
                            BlockchainError::Network(
                                "blockchain lock poisoned"
                                    .to_string(),
                            )
                        })?;

                blockchain
                    .chain()
                    .to_vec()
            };

            send_message(
                &mut stream,
                &NetworkMessage::ChainResponse(
                    chain
                ),
            )?;
        }

        NetworkMessage::ValidateChain(
            chain,
        ) => {
            let validation =
                Blockchain::from_chain(
                    chain,
                    Vec::new(),
                );

            let (
                valid,
                height,
            ) = match validation {
                Ok(chain) => (
                    true,
                    chain.height(),
                ),

                Err(_) => (
                    false,
                    0,
                ),
            };

            send_message(
                &mut stream,
                &NetworkMessage::ValidationResponse {
                    node_id,
                    valid,
                    height,
                },
            )?;
        }

        NetworkMessage::ProposeBlock(
            block,
        ) => {
            let accepted = {
                let blockchain =
                    blockchain
                        .lock()
                        .map_err(|_| {
                            BlockchainError::Network(
                                "blockchain lock poisoned"
                                    .to_string(),
                            )
                        })?;

                validate_proposed_block(
                    &blockchain,
                    &block,
                )
            };

            send_message(
                &mut stream,
                &NetworkMessage::ProposalResponse {
                    node_id,
                    accepted,
                },
            )?;
        }

        NetworkMessage::ChainResponse(_)
        | NetworkMessage::ValidationResponse { .. }
        | NetworkMessage::ProposalResponse { .. } => {}
    }

    Ok(())
}

fn validate_proposed_block(
    blockchain: &Blockchain,
    block: &Block,
) -> bool {
    if block.validate().is_err() {
        return false;
    }

    if block.index
        != blockchain.latest_block().index + 1
    {
        return false;
    }

    if block.previous_hash
        != blockchain.latest_block().hash
    {
        return false;
    }

    true
}

pub fn ping_node(
    address: &str,
) -> Result<bool, BlockchainError> {
    let mut stream =
        TcpStream::connect(
            address
        )?;

    send_message(
        &mut stream,
        &NetworkMessage::Ping,
    )?;

    match receive_message(
        &stream
    )? {
        NetworkMessage::Ping =>
            Ok(true),

        _ => Ok(false),
    }
}

pub fn request_chain(
    address: &str,
) -> Result<Vec<Block>, BlockchainError> {
    let mut stream =
        TcpStream::connect(
            address
        )?;

    send_message(
        &mut stream,
        &NetworkMessage::GetChain,
    )?;

    match receive_message(
        &stream
    )? {
        NetworkMessage::ChainResponse(
            chain
        ) => Ok(chain),

        _ => Err(
            BlockchainError::Network(
                "unexpected response"
                    .to_string(),
            )
        ),
    }
}

pub fn ask_node_to_validate(
    address: &str,
    chain: Vec<Block>,
) -> Result<
    (String, bool, u64),
    BlockchainError,
> {
    let mut stream =
        TcpStream::connect(
            address
        )?;

    send_message(
        &mut stream,
        &NetworkMessage::ValidateChain(
            chain
        ),
    )?;

    match receive_message(
        &stream
    )? {
        NetworkMessage::ValidationResponse {
            node_id,
            valid,
            height,
        } => Ok((
            node_id,
            valid,
            height,
        )),

        _ => Err(
            BlockchainError::Network(
                "unexpected validation response"
                    .to_string(),
            )
        ),
    }
}

pub fn consensus_validate(
    addresses: &[String],
    chain: Vec<Block>,
) -> Result<bool, BlockchainError> {
    if addresses.len() != 3 {
        return Err(
            BlockchainError::Network(
                "exactly 3 nodes are required"
                    .to_string(),
            )
        );
    }

    let mut valid_count =
        0usize;

    for address in addresses {
        match ask_node_to_validate(
            address,
            chain.clone(),
        ) {
            Ok((
                node_id,
                valid,
                height,
            )) => {
                println!(
                    "{}: valid={}, height={}",
                    node_id,
                    valid,
                    height
                );

                if valid {
                    valid_count += 1;
                }
            }

            Err(error) => {
                eprintln!(
                    "{}: {}",
                    address,
                    error
                );
            }
        }
    }

    Ok(valid_count >= 2)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ping_message_serializes() {
        let message =
            NetworkMessage::Ping;

        let json =
            serde_json::to_string(
                &message
            )
            .unwrap();

        assert!(
            json.contains("Ping")
        );
    }
}