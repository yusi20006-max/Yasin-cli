const path = require('path');
const fs = require('fs');
const OutputFormatter = require('../output/OutputFormatter');
const ExitCodes = require('../output/ExitCodes');
const { normalize } = require('../output/ErrorTaxonomy');

class CommandRegistry {
  constructor() {
    this.commands = new Map();
  }

  register(command) {
    if (!command || !command.name) throw new Error('Invalid command registration: Command must have a name.');
    this.commands.set(command.name, command);
  }

  getCommand(name) { return this.commands.get(name); }
  listCommands() { return Array.from(this.commands.values()); }

  dispatch(rawArgs) {
    const hasHelp = rawArgs.includes('--help') || rawArgs.includes('-h');
    const hasVersion = rawArgs.includes('--version') || rawArgs.includes('-v');
    let cmdName = null;
    let cmdIndex = -1;
    for (let i = 0; i < rawArgs.length; i++) {
      if (!rawArgs[i].startsWith('-')) { cmdName = rawArgs[i]; cmdIndex = i; break; }
    }

    if (hasVersion && !cmdName) {
      this.printVersion();
      process.exit(ExitCodes.SUCCESS);
      return;
    }
    if (!cmdName) {
      this.printGlobalHelp();
      process.exit(ExitCodes.SUCCESS);
      return;
    }

    const command = this.commands.get(cmdName);
    if (!command) {
      console.error(`Error: Unknown command "${cmdName}".\n`);
      this.printGlobalHelp();
      process.exit(ExitCodes.INVALID_COMMAND);
      return;
    }

    const commandRawArgs = [...rawArgs.slice(0, cmdIndex), ...rawArgs.slice(cmdIndex + 1)];

    try {
      const parsed = command.parse(commandRawArgs);

      if (parsed.options.json && !command.supportsJson) {
        const error = new Error(`Command "${cmdName}" does not support --json yet.`);
        error.type = 'INVALID_COMMAND';
        this.handleError(cmdName, error, parsed.options);
        return;
      }
      if (parsed.options.help || parsed.options.h) {
        this.printCommandHelp(command);
        process.exit(ExitCodes.SUCCESS);
        return;
      }

      const commandArgsDef = command.args || [];
      for (let i = 0; i < commandArgsDef.length; i++) {
        const argDef = commandArgsDef[i];
        if (argDef.required && (parsed.args[i] === undefined || parsed.args[i] === '')) {
          const error = new Error(`Missing required argument <${argDef.name}>.`);
          error.type = 'INVALID_COMMAND';
          this.handleError(cmdName, error, parsed.options);
          return;
        }
      }

      const result = command.execute(parsed.args, parsed.options);
      if (result && typeof result.then === 'function') {
        return result.then(res => this.handleResult(res, parsed.options)).catch(err => this.handleError(cmdName, err, parsed.options));
      }
      return this.handleResult(result, parsed.options);
    } catch (err) {
      const requestedJson = rawArgs.includes('--json');
      this.handleError(cmdName, err, { json: requestedJson });
    }
  }

  handleResult(result, options = {}) {
    const payload = result === undefined ? { ok: true, code: ExitCodes.SUCCESS, data: null } : result;
    if (options.json) console.log(OutputFormatter.json(payload));
    if (payload?.ok === false && Number.isInteger(payload.code) && payload.code !== ExitCodes.SUCCESS) {
      process.exit(payload.code);
    }
    return result;
  }

  handleError(cmdName, err, options = {}) {
    const normalized = normalize(err);
    if (options.json) {
      console.log(OutputFormatter.json({
        ok: false,
        code: normalized.code,
        error: { type: normalized.type, message: normalized.message }
      }));
    } else {
      console.error(`Error executing command "${cmdName}":`, normalized.message);
    }
    process.exit(normalized.code);
  }

  printVersion() {
    let version = '1.0.0';
    try {
      const pkgPath = path.join(__dirname, '..', '..', 'package.json');
      if (fs.existsSync(pkgPath)) version = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || version;
    } catch (e) { /* ignore */ }
    console.log(`Yasin CLI v${version}`);
  }

  printGlobalHelp() {
    let version = '1.0.0';
    try {
      const pkgPath = path.join(__dirname, '..', '..', 'package.json');
      if (fs.existsSync(pkgPath)) version = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || version;
    } catch (e) { /* ignore */ }
    console.log(`Yasin CLI - v${version}`);
    console.log('Description: Yasin CLI is a modular, extensible command line interface tool.\n');
    console.log('Usage: yasin <command> [arguments] [options]\n');
    console.log('Commands:');
    let maxLen = 0;
    this.commands.forEach((_, name) => { if (name.length > maxLen) maxLen = name.length; });
    this.commands.forEach((cmd, name) => console.log(`  ${name.padEnd(maxLen + 4, ' ')}${cmd.description || ''}`));
    console.log('\nGlobal Options:');
    console.log('  -h, --help     Show help information');
    console.log('  -v, --version  Show version information');
    console.log('      --json     Emit machine-readable JSON (supported commands only)');
  }

  printCommandHelp(command) {
    console.log(`Command: ${command.name}`);
    console.log(`Description: ${command.description || 'No description provided.'}\n`);
    const argsHelp = (command.args || []).map(arg => arg.required ? `<${arg.name}>` : `[${arg.name}]`).join(' ');
    console.log(`Usage: yasin ${command.name} ${argsHelp} [options]\n`);
    if (command.args && command.args.length > 0) {
      console.log('Arguments:');
      let maxLen = 0;
      command.args.forEach(arg => { if (arg.name.length > maxLen) maxLen = arg.name.length; });
      command.args.forEach(arg => console.log(`  ${arg.name.padEnd(maxLen + 4, ' ')}${arg.description || ''} ${arg.required ? '(Required)' : '(Optional)'}`));
      console.log();
    }
    if (command.options && command.options.length > 0) {
      console.log('Options:');
      let maxLen = 0;
      command.options.forEach(opt => { const n = `${opt.alias ? `${opt.alias}, ` : ''}${opt.name}`; if (n.length > maxLen) maxLen = n.length; });
      command.options.forEach(opt => { const n = `${opt.alias ? `${opt.alias}, ` : ''}${opt.name}`; console.log(`  ${n.padEnd(maxLen + 4, ' ')}${opt.description || ''} ${opt.default !== undefined ? `(Default: ${opt.default})` : ''}`); });
      console.log();
    }
    if (command.supportsJson) console.log('  --json         Emit machine-readable JSON');
  }
}

module.exports = CommandRegistry;
