const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// Match the existing attendance tests: execute production modules with mocked IO.
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(resolve(file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    Uint8Array,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    console: { error() {} },
  }, { filename: file });
  return exports;
}
const validation = load('src/lib/application/resume-upload.ts');
const { validateResumeFile, MAX_RESUME_BYTES, RESUME_FILE_ACCEPT } = validation;
const pdf = (name = 'resume.pdf', type = 'application/pdf') => new File(['%PDF-1.7\nsynthetic resume'], name, { type });

test('accepts PDFs, uppercase extension, and unknown browser MIME types', async () => {
  for (const file of [pdf(), pdf('RESUME.PDF'), pdf('resume.pdf', ''), pdf('resume.pdf', 'application/octet-stream')]) {
    await validateResumeFile(file);
  }
  assert.equal(RESUME_FILE_ACCEPT, '.pdf,application/pdf');
});
test('rejects Word, images, folders, and misleading filenames', async () => {
  for (const name of ['resume.doc', 'resume.docx', 'resume.png', 'resume.jpg', 'resume.jpeg', 'resume.pdf.exe', 'resume', 'folder']) {
    await assert.rejects(validateResumeFile(pdf(name)), /PDF/);
  }
});
test('rejects renamed non-PDF contents and conflicting MIME types', async () => {
  for (const bytes of ['', 'PK\u0003\u0004 Word document', '\u0089PNG image', '<html>not a PDF</html>']) {
    await assert.rejects(validateResumeFile(new File([bytes], 'resume.pdf', { type: 'application/pdf' })), /not a PDF/);
  }
  await assert.rejects(validateResumeFile(pdf('resume.pdf', 'image/png')), /PDF/);
});
test('accepts the size boundary and rejects oversized files before reading bytes', async () => {
  await validateResumeFile(new File(['%PDF-', new Uint8Array(MAX_RESUME_BYTES - 5)], 'resume.pdf'));
  await assert.rejects(validateResumeFile(new File(['%PDF-', new Uint8Array(MAX_RESUME_BYTES - 4)], 'resume.pdf')), /3MB/);
  let read = false;
  await assert.rejects(validateResumeFile({ name: 'resume.pdf', type: 'application/pdf', size: MAX_RESUME_BYTES + 1, slice() { read = true; } }), /3MB/);
  assert.equal(read, false);
});
test('reports unreadable files clearly', async () => {
  await assert.rejects(validateResumeFile({ name: 'resume.pdf', type: '', size: 10, slice() { return { async arrayBuffer() { throw new Error('read failed'); } }; } }), /Unable to read/);
});

function uploadHarness() {
  const writes = [];
  const api = load('src/services/applicants.ts', {
    '@/lib/application/resume-upload': validation,
    '@/lib/firebase/client': { db: {}, storage: {} },
    '@/lib/stores/applicant-store': {},
    '@/lib/stores/auth-store': {},
    'firebase/firestore': {},
    'firebase/storage': {
      ref(_storage, path) { return { path }; },
      async uploadBytes(ref, file, metadata) { writes.push({ ref, file, metadata }); return { ref }; },
      async getDownloadURL() { return 'https://example.org/resume'; },
    },
  });
  return { ...api, writes };
}
test('service rejects invalid uploads before overwriting an existing resume', async () => {
  const { uploadResumeToStorage, writes } = uploadHarness();
  await assert.rejects(uploadResumeToStorage('fixture-user', pdf('resume.docx')), /PDF/);
  await assert.rejects(uploadResumeToStorage('fixture-user', new File(['not a PDF'], 'resume.pdf')), /not a PDF/);
  assert.equal(writes.length, 0);
});
test('service uploads PDF at the legacy path with explicit download metadata', async () => {
  const { uploadResumeToStorage, writes } = uploadHarness();
  assert.equal(await uploadResumeToStorage('fixture-user', pdf()), 'https://example.org/resume');
  assert.equal(writes[0].ref.path, 'applicantResumes/fixture-user');
  assert.equal(writes[0].metadata.contentType, 'application/pdf');
  assert.match(writes[0].metadata.contentDisposition, /filename="resume.pdf"/);
});

test('service preserves international filenames through encoded PDF metadata', async () => {
  const { uploadResumeToStorage, writes } = uploadHarness();
  const name = "Résumé (final)'s.pdf";
  await uploadResumeToStorage('fixture-user', pdf(name));
  const header = writes[0].metadata.contentDisposition;
  const encoded = header.split("filename*=UTF-8''")[1];
  assert.equal(decodeURIComponent(encoded), name);
  assert.ok(!encoded.includes("'"));
  assert.ok(!encoded.includes('('));
});
