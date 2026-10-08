import {
  Blocks,
  ChevronRight
} from "lucide-react";

function BlockchainTable({
  blocks
}) {
  return (
    <div className="blockchain-table-wrapper">
      <table className="blockchain-table">
        <thead>
          <tr>
            <th>
              BLOCK
            </th>

            <th>
              HASH
            </th>

            <th>
              PREVIOUS HASH
            </th>

            <th>
              TRANSACTIONS
            </th>

            <th>
              TIMESTAMP
            </th>

            <th />
          </tr>
        </thead>

        <tbody>
          {blocks.map((block) => (
            <tr key={block.index}>
              <td>
                <div className="block-number">
                  <Blocks size={14} />

                  <strong>
                    #{block.index}
                  </strong>
                </div>
              </td>

              <td>
                <code>
                  {shortHash(
                    block.hash
                  )}
                </code>
              </td>

              <td>
                <code>
                  {shortHash(
                    block.previous_hash
                  )}
                </code>
              </td>

              <td>
                <span className="transaction-count">
                  {block.transactions
                    ?.length || 0}
                </span>
              </td>

              <td>
                {block.timestamp}
              </td>

              <td>
                <ChevronRight
                  size={15}
                  className="table-arrow"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function shortHash(hash) {
  if (!hash) {
    return "—";
  }

  if (hash.length <= 22) {
    return hash;
  }

  return `${hash.slice(
    0,
    10
  )}...${hash.slice(-8)}`;
}

export default BlockchainTable;