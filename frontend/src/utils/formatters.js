export function formatBytes(bytes) {
  if (!bytes) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  const index = Math.min(
    Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    ),
    units.length - 1
  );

  return `${(
    bytes /
    1024 ** index
  ).toFixed(2)} ${units[index]}`;
}

export function shortenHash(
  hash,
  start = 10,
  end = 8
) {
  if (!hash) {
    return "—";
  }

  if (
    hash.length <=
    start + end + 3
  ) {
    return hash;
  }

  return `${hash.slice(
    0,
    start
  )}...${hash.slice(-end)}`;
}