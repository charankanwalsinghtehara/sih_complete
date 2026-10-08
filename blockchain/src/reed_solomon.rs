use crate::error::BlockchainError;
use crate::models::sha256_hex;

#[derive(Debug, Clone)]
pub struct ReedSolomonConfig {
    pub data_shards: usize,
    pub parity_shards: usize,
}

impl ReedSolomonConfig {
    pub fn new(
        data_shards: usize,
        parity_shards: usize,
    ) -> Result<Self, BlockchainError> {
        if data_shards == 0 {
            return Err(BlockchainError::InvalidBlock(
                "data shard count must be greater than zero"
                    .to_string(),
            ));
        }

        if parity_shards == 0 {
            return Err(BlockchainError::InvalidBlock(
                "parity shard count must be greater than zero"
                    .to_string(),
            ));
        }

        Ok(Self {
            data_shards,
            parity_shards,
        })
    }

    pub fn total_shards(&self) -> usize {
        self.data_shards + self.parity_shards
    }
}

#[derive(Debug, Clone)]
pub struct Shard {
    pub index: usize,
    pub is_parity: bool,
    pub data: Vec<u8>,
    pub hash: String,
}

impl Shard {
    fn new(
        index: usize,
        is_parity: bool,
        data: Vec<u8>,
    ) -> Self {
        let hash = sha256_hex(&data);

        Self {
            index,
            is_parity,
            data,
            hash,
        }
    }

    pub fn verify(&self) -> bool {
        sha256_hex(&self.data) == self.hash
    }
}

#[derive(Debug, Clone)]
pub struct ShardSet {
    pub original_size: usize,
    pub shard_size: usize,
    pub config: ReedSolomonConfig,
    pub shards: Vec<Option<Shard>>,
}

impl ShardSet {
    pub fn encode(
        data: &[u8],
        config: ReedSolomonConfig,
    ) -> Result<Self, BlockchainError> {
        if data.is_empty() {
            return Err(BlockchainError::InvalidBlock(
                "cannot encode empty data".to_string(),
            ));
        }

        let shard_size =
            data.len().div_ceil(config.data_shards);

        let mut shards = Vec::new();

        for index in 0..config.data_shards {
            let start = index * shard_size;

            let end =
                std::cmp::min(start + shard_size, data.len());

            let mut shard_data =
                vec![0u8; shard_size];

            if start < data.len() {
                shard_data[..end - start]
                    .copy_from_slice(&data[start..end]);
            }

            shards.push(Some(Shard::new(
                index,
                false,
                shard_data,
            )));
        }

        /*
         * M5 uses XOR parity.
         *
         * This gives a simple Reed-Solomon-style
         * redundancy layer for the project.
         *
         * The parity shards are generated independently
         * using rotating XOR combinations.
         */

        for parity_index in 0..config.parity_shards {
            let mut parity =
                vec![0u8; shard_size];

            for data_index in 0..config.data_shards {
                let data_shard =
                    shards[data_index]
                        .as_ref()
                        .unwrap();

                for byte_index in 0..shard_size {
                    let rotation =
                        (byte_index
                            + parity_index
                            + data_index)
                            % shard_size;

                    parity[byte_index] ^=
                        data_shard.data[rotation];
                }
            }

            shards.push(Some(Shard::new(
                config.data_shards + parity_index,
                true,
                parity,
            )));
        }

        Ok(Self {
            original_size: data.len(),
            shard_size,
            config,
            shards,
        })
    }

    pub fn mark_missing(
        &mut self,
        index: usize,
    ) -> Result<(), BlockchainError> {
        if index >= self.shards.len() {
            return Err(BlockchainError::InvalidBlock(
                "shard index out of range".to_string(),
            ));
        }

        self.shards[index] = None;

        Ok(())
    }

    pub fn corrupt(
        &mut self,
        index: usize,
    ) -> Result<(), BlockchainError> {
        if index >= self.shards.len() {
            return Err(BlockchainError::InvalidBlock(
                "shard index out of range".to_string(),
            ));
        }

        if let Some(shard) = &mut self.shards[index] {
            if !shard.data.is_empty() {
                shard.data[0] ^= 0xff;
            }
        }

        Ok(())
    }

    pub fn available_count(&self) -> usize {
        self.shards.iter().filter(|s| s.is_some()).count()
    }

    pub fn verify_shards(&self) -> bool {
        self.shards.iter().all(|shard| {
            match shard {
                Some(shard) => shard.verify(),
                None => true,
            }
        })
    }

    pub fn recover(&mut self) -> Result<(), BlockchainError> {
        let missing_data =
            (0..self.config.data_shards)
                .filter(|index| {
                    self.shards[*index].is_none()
                })
                .collect::<Vec<_>>();

        if missing_data.is_empty() {
            return Ok(());
        }

        /*
         * We need enough information to reconstruct
         * the missing data for this implementation.
         *
         * The recovery algorithm uses available parity
         * and surviving data shards.
         */

        if self.available_count()
            < self.config.data_shards
        {
            return Err(BlockchainError::InvalidBlock(
                "not enough shards available for recovery"
                    .to_string(),
            ));
        }

        for missing_index in missing_data {
            let mut recovered =
                vec![0u8; self.shard_size];

            let parity_shard = self
                .shards
                .iter()
                .filter_map(|s| s.as_ref())
                .find(|s| s.is_parity);

            let parity = match parity_shard {
                Some(value) => value,
                None => {
                    return Err(
                        BlockchainError::InvalidBlock(
                            "no parity shard available"
                                .to_string(),
                        ),
                    )
                }
            };

            for byte_index in 0..self.shard_size {
                let mut value =
                    parity.data[byte_index];

                for data_index in
                    0..self.config.data_shards
                {
                    if data_index == missing_index {
                        continue;
                    }

                    if let Some(shard) =
                        &self.shards[data_index]
                    {
                        let rotation =
                            (byte_index
                                + data_index)
                                % self.shard_size;

                        value ^= shard.data[rotation];
                    }
                }

                recovered[byte_index] = value;
            }

            self.shards[missing_index] =
                Some(Shard::new(
                    missing_index,
                    false,
                    recovered,
                ));
        }

        Ok(())
    }

    pub fn reconstruct(
        &mut self,
    ) -> Result<Vec<u8>, BlockchainError> {
        self.recover()?;

        if !self.verify_shards() {
            return Err(BlockchainError::InvalidBlock(
                "recovered shard verification failed"
                    .to_string(),
            ));
        }

        let mut output = Vec::new();

        for index in 0..self.config.data_shards {
            let shard =
                self.shards[index]
                    .as_ref()
                    .ok_or_else(|| {
                        BlockchainError::InvalidBlock(
                            "missing data shard after recovery"
                                .to_string(),
                        )
                    })?;

            output.extend_from_slice(&shard.data);
        }

        output.truncate(self.original_size);

        Ok(output)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encoding_creates_data_and_parity_shards() {
        let config =
            ReedSolomonConfig::new(4, 2)
                .unwrap();

        let data =
            b"SecureTrace evidence data";

        let shards =
            ShardSet::encode(data, config)
                .unwrap();

        assert_eq!(
            shards.shards.len(),
            6
        );

        assert_eq!(
            shards.available_count(),
            6
        );
    }

    #[test]
    fn shards_have_valid_hashes() {
        let config =
            ReedSolomonConfig::new(4, 2)
                .unwrap();

        let shards =
            ShardSet::encode(
                b"SecureTrace",
                config,
            )
            .unwrap();

        assert!(shards.verify_shards());
    }

    #[test]
    fn missing_shard_is_detected() {
        let config =
            ReedSolomonConfig::new(4, 2)
                .unwrap();

        let mut shards =
            ShardSet::encode(
                b"SecureTrace evidence",
                config,
            )
            .unwrap();

        shards.mark_missing(1).unwrap();

        assert_eq!(
            shards.available_count(),
            5
        );
    }

    #[test]
    fn data_can_be_reconstructed() {
        let config =
            ReedSolomonConfig::new(4, 2)
                .unwrap();

        let original =
            b"SecureTrace evidence";

        let mut shards =
            ShardSet::encode(
                original,
                config,
            )
            .unwrap();

        shards.mark_missing(1).unwrap();

        let recovered =
            shards.reconstruct().unwrap();

        assert_eq!(
            recovered,
            original
        );
    }
}