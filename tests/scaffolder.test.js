const fs = require('fs');
const os = require('os');
const path = require('path');
const ProjectScaffolder = require('../src/dev/ProjectScaffolder');

describe('ProjectScaffolder', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-cli-scaffold-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test.each([
    ['plugin', 'demo-plugin', ['yasin-plugin.json', 'index.js', 'README.md']],
    ['service', 'demo-service', ['service.json', 'README.md']],
    ['adapter', 'demo-adapter', ['DemoAdapter.js', 'README.md']]
  ])('creates %s scaffold', (type, name, files) => {
    const result = new ProjectScaffolder(root)[`create${type[0].toUpperCase()}${type.slice(1)}`](name);
    expect(result.type).toBe(type);
    files.forEach(file => expect(fs.existsSync(path.join(root, name, file))).toBe(true));
  });

  test('rejects traversal-like names', () => {
    const scaffolder = new ProjectScaffolder(root);
    expect(() => scaffolder.createPlugin('../escape')).toThrow();
  });

  test('does not overwrite non-empty targets', () => {
    const target = path.join(root, 'existing');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'keep.txt'), 'keep');
    expect(() => new ProjectScaffolder(root).createPlugin('existing')).toThrow('not empty');
  });
});
