export const MAX_RESUME_BYTES = 3 * 1024 * 1024;
export const RESUME_FILE_ACCEPT = ".pdf,application/pdf";

/** Checks new uploads only; existing resume URLs remain valid regardless of format. */
export async function validateResumeFile(file: File): Promise<void> {
  if (!/\.pdf$/i.test(file.name)) {
    throw new Error("Please upload your resume as a PDF (.pdf)");
  }
  if (file.size > MAX_RESUME_BYTES) {
    throw new Error("File must be 3MB or smaller");
  }
  const mimeType = file.type.split(";")[0].trim().toLowerCase();
  // Some browsers provide no type, or a generic binary type. Check their bytes too.
  if (mimeType && mimeType !== "application/pdf" && mimeType !== "application/octet-stream") {
    throw new Error("Please upload your resume as a PDF (.pdf)");
  }

  let header: ArrayBuffer;
  try {
    header = await file.slice(0, 5).arrayBuffer();
  } catch {
    throw new Error("Unable to read this file. Please select your PDF again");
  }
  if (String.fromCharCode(...new Uint8Array(header)) !== "%PDF-") {
    throw new Error("This file is not a PDF. Export your resume as a PDF and try again");
  }
}
