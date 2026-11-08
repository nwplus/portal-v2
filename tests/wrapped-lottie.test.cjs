const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { load } = require('./load-ts.cjs');

const { withWebfont, LOTTIE_FONT_FAMILY, LOTTIE_FONT_WEIGHT } = load('src/lib/wrapped/lottie.ts');

const readComp = () => JSON.parse(readFileSync('public/assets/wrapped/github/github-metrics.json', 'utf8'));

test('a font with no weight gets the default, and one that names a weight keeps it', () => {
  const { fonts } = withWebfont({
    fonts: {
      list: [
        { fFamily: 'HK Grotesk', fWeight: '', fStyle: 'Bold' },
        { fFamily: 'HK Grotesk', fStyle: 'SemiBold' },
        { fFamily: 'Hanken Grotesk', fWeight: '600', fStyle: '' },
      ],
    },
  });
  assert.deepEqual(
    fonts.list.map((font) => font.fWeight),
    [LOTTIE_FONT_WEIGHT, LOTTIE_FONT_WEIGHT, '600'],
  );
  for (const font of fonts.list) {
    assert.equal(font.fFamily, LOTTIE_FONT_FAMILY);
    assert.equal(font.fStyle, '');
  }
});

test('the GitHub comp carries its own copy, spelled right', () => {
  const text = (name) => {
    const layer = readComp().layers.find((candidate) => candidate.nm === name);
    return layer.t.d.k[0].s.t;
  };
  assert.equal(text('.teamCommitted'), 'Your team committed');
  assert.equal(text('.teamLines'), 'lines of code');
  assert.equal(text('.youCommitted'), 'You committed');
  assert.equal(text('.youLines'), 'lines of code');
});

test("every layer in the GitHub comp uses a font it declares", () => {
  const comp = readComp();
  const declared = comp.fonts.list.map((font) => font.fName);
  for (const layer of comp.layers) assert.ok(declared.includes(layer.t.d.k[0].s.f), layer.nm);
});
