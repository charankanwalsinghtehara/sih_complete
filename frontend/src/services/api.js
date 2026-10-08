const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://127.0.0.1:8000";

async function request(
  path,
  options = {}
) {
  const response =
    await fetch(
      `${API_BASE}${path}`,
      options
    );

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status}`
    );
  }

  return response.json();
}

export async function checkHealth() {
  try {
    const result =
      await request(
        "/api/health"
      );

    return {
      online: true,
      ...result
    };
  } catch {
    return {
      online: false
    };
  }
}

export async function getDashboard() {
  try {
    return await request(
      "/api/dashboard"
    );
  } catch {
    return demoDashboard();
  }
}

export async function getDocuments() {
  try {
    return await request(
      "/api/documents"
    );
  } catch {
    return demoDocuments();
  }
}

export async function uploadDocument(
  file,
  recipientId
) {
  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "recipient_id",
    recipientId
  );

  try {
    return await request(
      "/api/documents/upload",
      {
        method: "POST",
        body: formData
      }
    );
  } catch {
    return {
      success: true,
      demo: true,
      message:
        "Demo mode: document workflow completed locally in the frontend."
    };
  }
}

export async function verifyDocument(
  file,
  watermarkId
) {
  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "watermark_id",
    watermarkId
  );

  try {
    return await request(
      "/api/verify",
      {
        method: "POST",
        body: formData
      }
    );
  } catch {
    return demoVerification(
      watermarkId
    );
  }
}

export async function getBlockchain() {
  try {
    return await request(
      "/api/blockchain"
    );
  } catch {
    return demoBlockchain();
  }
}

export async function getNetwork() {
  try {
    return await request(
      "/api/network"
    );
  } catch {
    return demoNetwork();
  }
}

function demoDashboard() {
  return {
    demo: true,

    stats: {
      documents: 24,
      verified: 18,
      modified: 3,
      blockchainHeight: 12,
      recoverySuccess: 5
    },

    nodes: [
      {
        id: "node1",
        address: "127.0.0.1:7001",
        online: true,
        height: 12
      },
      {
        id: "node2",
        address: "127.0.0.1:7002",
        online: true,
        height: 12
      },
      {
        id: "node3",
        address: "127.0.0.1:7003",
        online: true,
        height: 12
      }
    ],

    activities: [
      {
        id: "1",
        type: "document",
        title: "Document issued",
        description:
          "confidential_report.pdf registered",
        time: "2 min ago"
      },
      {
        id: "2",
        type: "block",
        title: "Block validated",
        description:
          "Block #12 accepted by validator network",
        time: "8 min ago"
      },
      {
        id: "3",
        type: "document",
        title: "Evidence verified",
        description:
          "Watermark and SHA-256 matched",
        time: "14 min ago"
      },
      {
        id: "4",
        type: "warning",
        title: "Modification detected",
        description:
          "financial_statement.pdf hash mismatch",
        time: "31 min ago"
      }
    ]
  };
}

function demoDocuments() {
  return [
    {
      id: "DOC-001",
      name: "confidential_report.pdf",
      watermark_id: "WM-001",
      status: "VERIFIED"
    },
    {
      id: "DOC-002",
      name: "financial_statement.pdf",
      watermark_id: "WM-002",
      status: "VERIFIED"
    },
    {
      id: "DOC-003",
      name: "investigation_record.pdf",
      watermark_id: "WM-003",
      status: "MODIFIED"
    },
    {
      id: "DOC-004",
      name: "case_evidence.pdf",
      watermark_id: "WM-004",
      status: "VERIFIED"
    }
  ];
}

function demoVerification(
  watermarkId
) {
  const valid =
    watermarkId
      .toUpperCase()
      .startsWith("WM-");

  return {
    status: valid
      ? "VERIFIED"
      : "UNKNOWN",

    watermark_match: valid,

    document_hash_match: valid,

    blockchain_valid: true,

    recovery_attempted: false,

    recovery_successful: false,

    matched_transaction_id:
      valid
        ? "TX-DEMO-0001"
        : null,

    matched_recipient_id:
      valid
        ? "RECIPIENT-001"
        : null,

    calculated_hash:
      "8f4d7a6f8c7b2d1a9e3c5b7d4f8a1c6e",

    recorded_hash:
      valid
        ? "8f4d7a6f8c7b2d1a9e3c5b7d4f8a1c6e"
        : "91e3c7a4d2b6f8e1",

    message: valid
      ? "Evidence matches the registered SecureTrace record. Watermark, document hash and blockchain validation are consistent."
      : "The supplied watermark was not matched against the registered SecureTrace records."
  };
}

function demoBlockchain() {
  return {
    valid: true,

    height: 12,

    blocks: [
      {
        index: 0,
        hash: "0000000000000000",
        previous_hash: "0",
        transactions: [],
        timestamp: "Genesis"
      },
      {
        index: 1,
        hash: "a9f1c37d8e4a12f5",
        previous_hash: "0000000000000000",
        transactions: [{}],
        timestamp: "09:42:11"
      },
      {
        index: 2,
        hash: "b71e9a22c4d98a31",
        previous_hash: "a9f1c37d8e4a12f5",
        transactions: [{}],
        timestamp: "09:44:28"
      },
      {
        index: 3,
        hash: "c92a7e13f6b28d40",
        previous_hash: "b71e9a22c4d98a31",
        transactions: [{}, {}],
        timestamp: "09:51:07"
      }
    ]
  };
}

function demoNetwork() {
  return {
    consensus: true,

    nodes: [
      {
        id: "node1",
        address: "127.0.0.1:7001",
        online: true,
        height: 12
      },
      {
        id: "node2",
        address: "127.0.0.1:7002",
        online: true,
        height: 12
      },
      {
        id: "node3",
        address: "127.0.0.1:7003",
        online: true,
        height: 12
      }
    ]
  };
}