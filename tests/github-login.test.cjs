const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./load-ts.cjs');

const githubLogin = load('src/lib/github-login.ts');
const { normalizeUrl, normalizeGithubUrl } = load('src/lib/application/normalize-url.ts', {
  '@/lib/github-login': githubLogin,
});
const deps = { '@/lib/github-login': githubLogin };
for (const name of ['./form-mapping', './object-path']) deps[name] = {};
deps['./normalize-url'] = { normalizeUrl, normalizeGithubUrl };
const { isGithubUrl } = load('src/lib/application/utils.ts', deps);
const { parseGithubLogin } = githubLogin;

test('parseGithubLogin reads every accepted shape and rejects the rest', () => {
  const cases = [
    ['https://github.com/Octo-Cat', 'octo-cat'],
    ['github.com/octocat', 'octocat'],
    ['https://www.github.com/octocat/', 'octocat'],
    ['https://github.com/octocat/some-repo', 'octocat'],
    ['https://github.com/octocat?tab=repositories', 'octocat'],
    ['https://gist.github.com/octocat', 'octocat'],
    ['https://octocat.github.io', 'octocat'],
    ['octocat', 'octocat'],
    ['@octocat', 'octocat'],
    ['', null],
    [undefined, null],
    ['N/A', null],
    ['na', null],
    ['none', null],
    ['https://github.com/', null],
    ['https://github.com/orgs/nwplus', null],
    ['https://github.com/settings/profile', null],
    ['https://docs.github.com/octocat', null],
    ['https://linkedin.com/in/octocat', null],
    ['https://octocat/', null],
    ['https://github.com/-bad-', null],
  ];
  for (const [input, expected] of cases) assert.equal(parseGithubLogin(input), expected, String(input));
});

test('form: a bare username is stored as a profile URL', () => {
  assert.equal(normalizeGithubUrl('octocat'), 'https://github.com/octocat');
  assert.equal(normalizeGithubUrl(' @Octo-Cat '), 'https://github.com/Octo-Cat');
  assert.equal(normalizeGithubUrl('github.com/octocat'), 'https://github.com/octocat');
  assert.equal(normalizeGithubUrl('N/A'), 'N/A');
  assert.equal(normalizeGithubUrl('none'), 'https://none/');
  assert.equal(normalizeGithubUrl(''), '');
});

test('every value the form accepts is one the script can parse', () => {
  const typed = [
    'octocat', '@octocat', 'github.com/octocat', 'www.github.com/octocat/repo',
    'https://gist.github.com/octocat', 'octocat.github.io', 'https://github.com/',
    'https://github.com/orgs/nwplus', 'https://docs.github.com/en', 'none', 'linkedin.com/in/x',
  ];
  for (const input of typed) {
    const stored = normalizeGithubUrl(input);
    if (isGithubUrl(stored)) assert.notEqual(parseGithubLogin(stored), null, input);
  }
  assert.equal(isGithubUrl('https://github.com/'), false);
  assert.equal(isGithubUrl('https://github.com/orgs/nwplus'), false);
  assert.equal(isGithubUrl('http://github.com/octocat'), false);
  assert.equal(isGithubUrl('https://github.com/octocat'), true);
});
