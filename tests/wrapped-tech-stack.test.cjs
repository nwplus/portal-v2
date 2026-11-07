const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./load-ts.cjs');

const widths = load('src/lib/wrapped/text-width.ts');
const { fitTechStack, techDisplayName } = load('src/lib/wrapped/tech-stack.ts', {
  '@/lib/wrapped/text-width': widths,
});

const SLOTS = 4;
/** What the slide shows on a 390x844 phone, past where the names start. */
const VISIBLE_WIDTH = 263;

/** Every line, at the size it's drawn: layers are scaled to 50%. */
function assertFits({ names, layerSize }) {
  for (const line of names.flatMap((name) => name.split('\r'))) {
    const width = widths.textWidth(line, layerSize / 2, 800);
    assert.ok(width <= VISIBLE_WIDTH, `${line} is ${width}px at ${layerSize / 2}px`);
  }
}

test('Devpost slugs become display names', () => {
  const names = {
    'react-native': 'React Native',
    'react native': 'React Native',
    tailwindcss: 'Tailwind CSS',
    'tailwind-css': 'Tailwind CSS',
    typescript: 'TypeScript',
    'next.js': 'Next.js',
    nextjs: 'Next.js',
    'shadcn/ui': 'shadcn/ui',
    'shadcn-ui': 'shadcn/ui',
    'scikit-learn': 'scikit-learn',
    'google-cloud-speech-to-text': 'Google Cloud Speech-to-Text',
    'lcd-display': 'LCD Display',
    'web-speech-api': 'Web Speech API',
    'python/flask': 'Python/Flask',
    firebase: 'Firebase',
  };
  for (const [slug, name] of Object.entries(names)) assert.equal(techDisplayName(slug), name);
});

test('a name with capitals is left as written', () => {
  for (const name of ['Google Cloud Platform', 'PostgreSQL', 'Claude Code', 'iOS']) {
    assert.equal(techDisplayName(name), name);
  }
});

test('an inherited object key is not a known tool', () => {
  assert.equal(techDisplayName('constructor'), 'Constructor');
});

test('short names stay on one line at the comp size', () => {
  assert.deepEqual(fitTechStack(['React', 'Rust', 'Go', 'Vue'], SLOTS), {
    names: ['React', 'Rust', 'Go', 'Vue'],
    layerSize: 100,
  });
});

test('names that overflow wrap at a space, sharing one smaller size', () => {
  const fitted = fitTechStack(
    ['Google Cloud Platform', 'Amazon Web Services', 'PostgreSQL', 'TypeScript'],
    SLOTS,
  );
  assert.deepEqual(fitted.names, [
    'Google Cloud\rPlatform',
    'Amazon Web\rServices',
    'PostgreSQL',
    'TypeScript',
  ]);
  assert.ok(fitted.layerSize < 100);
  assertFits(fitted);
});

test('a hyphen-only name wraps after a hyphen and keeps it', () => {
  const fitted = fitTechStack(['Speech-to-Text-Engine'], SLOTS);
  assert.deepEqual(fitted.names, ['Speech-to-\rText-Engine']);
  assertFits(fitted);
});

test('a real slug fits two lines', () => {
  const fitted = fitTechStack(['google-cloud-speech-to-text'], SLOTS);
  assert.deepEqual(fitted.names, ['Google Cloud\rSpeech-to-Text']);
  assertFits(fitted);
});

test('wide letters shrink a name that a character count would pass', () => {
  assertFits(fitTechStack(['WebAssembly'], SLOTS));
  assertFits(fitTechStack(['MMMMMMMM'], SLOTS));
});

test('an unbreakable name past the smallest size is cut, not clipped', () => {
  const fitted = fitTechStack(['Pneumonoultramicroscopicsilicovolcano'], SLOTS);
  assert.ok(fitted.names[0].endsWith('…'));
  assertFits(fitted);
});

test('slugs that tidy to one name take one slot, and only the first few are shown', () => {
  const { names } = fitTechStack(['react', 'react.js', 'rust', 'go', 'vue', 'svelte'], SLOTS);
  assert.deepEqual(names, ['React', 'Rust', 'Go', 'Vue']);
});

test('an empty stack fills no slots', () => {
  assert.deepEqual(fitTechStack([], SLOTS), { names: [], layerSize: 100 });
});
