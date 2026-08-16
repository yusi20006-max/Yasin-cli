const { spawnSync } = require('child_process');

const commands = [
  ['npm', ['test']],
  ['npm', ['run', 'lint']],
  ['npm', ['run', 'smoke']],
  ['npm', ['run', 'pack:check']],
  ['npm', ['audit', '--omit=dev']],
];

const env = { ...process.env };

delete env.npm_config_allow_scripts;
delete env.NPM_CONFIG_ALLOW_SCRIPTS;

for (const [command, args] of commands) {
  console.log(`\n>>> ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\nRelease check: PASS');
