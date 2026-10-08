import {
  FileUp,
  FileCheck2
} from "lucide-react";

import { useRef, useState } from "react";

function FileDropzone({
  file,
  onFileSelected
}) {
  const inputRef = useRef(null);

  const [dragging, setDragging] =
    useState(false);

  const selectFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    onFileSelected(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setDragging(false);

    selectFile(
      event.dataTransfer.files?.[0]
    );
  };

  if (file) {
    return (
      <div className="selected-file-card">
        <div className="selected-file-icon">
          <FileCheck2 size={23} />
        </div>

        <div className="selected-file-info">
          <strong>
            {file.name}
          </strong>

          <span>
            {formatBytes(file.size)}
          </span>
        </div>

        <button
          className="change-file-button"
          onClick={() =>
            inputRef.current?.click()
          }
        >
          Change
        </button>

        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(event) =>
            selectFile(
              event.target.files?.[0]
            )
          }
        />
      </div>
    );
  }

  return (
    <div
      className={`file-dropzone ${
        dragging
          ? "file-dropzone-dragging"
          : ""
      }`}
      onClick={() =>
        inputRef.current?.click()
      }
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() =>
        setDragging(false)
      }
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={(event) =>
          selectFile(
            event.target.files?.[0]
          )
        }
      />

      <div className="dropzone-icon">
        <FileUp size={25} />
      </div>

      <strong>
        Drop evidence document here
      </strong>

      <span>
        or click to browse from this workstation
      </span>

      <small>
        PDF, DOCX, TXT and supported evidence formats
      </small>
    </div>
  );
}

function formatBytes(bytes) {
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

export default FileDropzone;