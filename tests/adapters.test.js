const fs = require('fs');
const path = require('path');
const os = require('os');
const ConfigManager = require('../src/config/ConfigManager');
const ServiceManager = require('../src/services/ServiceManager');
const CoreAdapter = require('../src/adapters/CoreAdapter');
const AgentAdapter = require('../src/adapters/AgentAdapter');
const HubAdapter = require('../src/adapters/HubAdapter');
const RelayAdapter = require('../src/adapters/RelayAdapter');

const nodeCommand = process.execPath;
const nodeVersionArgs = ['--version'];
const nodeLoopArgs = ['-e', 'setInterval(() => {}, 1000)'];
const nodeRunArgs = ['-e', 'process.stdout.write("ok\\n")'];

function configure(config, id, name, mode, args, versionCommandArgs = nodeVersionArgs) {
  config.set(`services.${id}`, { id, name, command: nodeCommand, args, mode, versionCommand: nodeCommand, versionCommandArgs, env: {} });
}

describe('Ecosystem Adapters', () => {
  let config; let manager; let configPath;
  beforeEach(() => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-adapter-')); configPath = path.join(dir, 'config.json'); config = new ConfigManager(configPath); manager = new ServiceManager(config); });
  afterEach(() => { try { manager.listServices().filter(s => s.status === 'running').forEach(s => manager.stopService(s.id)); } catch (e) {} try { fs.rmSync(path.dirname(configPath), { recursive: true, force: true }); } catch (e) {} });

  test('Core is a library and can probe a configured version command', () => {
    config.set('services.yasin-core', { id: 'yasin-core', name: 'Yasin-Core', mode: 'library', versionCommand: nodeCommand, versionCommandArgs: nodeVersionArgs });
    const adapter = new CoreAdapter(config, manager);
    expect(adapter.capabilities().start).toBe(false);
    expect(adapter.status().status).toBe('on-demand');
    expect(adapter.version().status).toBe('ok');
    expect(() => adapter.start()).toThrow('library-only');
  });

  test('regression: a fresh adapter with no run command still auto-registers its own default versionCommandArgs (not silently dropped to [])', () => {
    // Reproduces the real yasin-core scenario: no defaultCommand at all (mode:
    // 'library'), only a defaultVersionCommand + defaultVersionCommandArgs
    // pair supplied directly in the definition, with nothing pre-populated in
    // config. Previously, BaseEcosystemAdapter's constructor never stored
    // definition.defaultVersionCommandArgs, and resolveDefinition()'s fallback
    // for versionCommandArgs only worked when versionCommand === command --
    // which is never true here, since command is null. That silently produced
    // versionCommandArgs: [], so version() ran the interpreter with zero
    // arguments and always returned { version: null, status: 'unknown' }.
    class FakeLibraryAdapter extends require('../src/adapters/BaseEcosystemAdapter') {
      constructor(cfg, mgr) {
        super(cfg, mgr, {
          serviceId: 'fake-lib',
          configKey: 'fake',
          envPrefix: 'FAKE_LIB',
          serviceName: 'Fake Library',
          mode: 'library',
          defaultVersionCommand: nodeCommand,
          defaultVersionCommandArgs: ['-e', 'console.log("9.9.9")']
        });
      }
    }
    const adapter = new FakeLibraryAdapter(config, manager);
    const result = adapter.version();
    expect(result.status).toBe('ok');
    expect(result.version).toBe('9.9.9');
  });

  test('Agent is an on-demand service', () => {
    configure(config, 'yasin-agent', 'Yasin-Agent', 'oneshot', nodeRunArgs);
    const adapter = new AgentAdapter(config, manager);
    expect(adapter.capabilities().run).toBe(true);
    expect(adapter.capabilities().start).toBe(false);
    expect(adapter.version().status).toBe('ok');
    expect(adapter.run().status).toBe(0);
  });

  test('Hub is an on-demand service', () => {
    configure(config, 'yasin-hub', 'YasinHub', 'oneshot', nodeRunArgs);
    const adapter = new HubAdapter(config, manager);
    expect(adapter.capabilities().run).toBe(true);
    expect(adapter.version().status).toBe('ok');
    expect(adapter.run().status).toBe(0);
  });

  test('Relay is a managed daemon', () => {
    configure(config, 'yasin-relay', 'YasinRelay', 'daemon', nodeLoopArgs);
    const adapter = new RelayAdapter(config, manager);
    expect(adapter.capabilities().start).toBe(true);
    expect(adapter.version().status).toBe('ok');
    const started = adapter.start();
    expect(started.status).toBe('running');
    expect(adapter.status().status).toBe('running');
    expect(adapter.stop()).toBe(true);
  });
});
