const path = require('path');
const fs = require('fs');
const OutputFormatter = require('../output/OutputFormatter');
const ExitCodes = require('../output/ExitCodes');

class CommandRegistry {
  constructor() {
    this.commands = new Map();
  }

  register(command) {
    if (!command || !command.name) {
      throw new Error('Invalid command registration: Command must have a name.');
    }
    this.commands.set(command.name, command);
  }

  getCommand(name) {
    return this.commands.get(name);
  }

  listCommands() {
    return Array.from(this.commands.values());
  }

  dispatch(rawArgs) {
    const hasHelp = rawArgs.includes('--help') || rawArgs.includes('-h');
    const hasVersion = rawArgs.includes('--version') || rawArgs.includes('-v');

    let cmdName = null;
    let cmdIndex = -1;
    for (let i = 0; i < rawArgs.length; i++) {
      if (!rawArgs[i].startsWith('-')) {
        cmdName = rawArgs[i];
        cmdIndex = i;
        break;
      }
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
      console.error(`Error: Unknown command \"${cmdName}\".\n`);
      this.printGlobalHelp();
      process.exit(ExitCodes.INVALID_COMMAND);
      return;
    }

    const commandRawArgs = [
      ...rawArgs.slice(0, cmdIndex),
      ...rawArgs.slice(cmdIndex + 1)
    ];

    const parsed = command.parse(commandRawArgs);

    if (parsed.options.json && !command.supportsJson) {
      console.error(`Error: Command \"${cmdName}\" does not support --json yet.`);
      process.exit(ExitCodes.INVALID_COMMAND);
      return;
    }

    if (parsed.options.help || parsed.options.h) {
      this.printCommandHelp(command);
      process.exit(ExitCodes.SUCCESS);
      return;
    }

    const commandArgsDef = command.args || [];
    const givenArgs = parsed.args;

    for (let i = 0; i < commandArgsDef.length; i++) {
      const argDef = commandArgsDef[i];
      if (argDef.required && (givenArgs[i] === undefined || givenArgs[i] === '')) {
        console.error(`Error: Missing required argument <${argDef.name}>.\n`);
        this.printCommandHelp(command);
        process.exit(ExitCodes.INVALID_COMMAND);
        return;
      }
    }

    try {
      const result = command.execute(givenArgs, parsed.options);
      if (result && typeof result.then === 'function') {
        return result.then(res => this.handleResult(res, parsed.options)).catch(err => {
          this.handleError(cmdName, err, parsed.options);
        });
      }
      return this.handleResult(result, parsed.options);
    } catch (err) {
      this.handleError(cmdName, err, parsed.options);
      return;
    }
  }

  handleResult(result, options = {}) {
    if (!options.json) return result;

    const payload = result === undefined
      ? { ok: true, code: ExitCodes.SUCCESS, data: null }
      : result;

    console.log(OutputFormatter.json(payload));

    if (payload && Number.isInteger(payload.code) && payload.code !== ExitCodes.SUCCESS) {
      process.exit(payload.code);
    }

    return result;
  }

  handleError(cmdName, err, options = {}) {
    if (options.json) {
      console.log(OutputFormatter.json({
        ok: false,
        code: ExitCodes.GENERAL_ERROR,
        error: { message: err.message }
      }));
    } else {
      console.error(`Error executing command \"${cmdName}\":`, err.message);
    }
    process.exit(ExitCodes.GENERAL_ERROR);
  }

  printVersion() {
    let version = '1.0.0';
    try {
      const pkgPath = path.join(__dirname, '..', '..', 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        version = pkg.version || version;
      }
    } catch (e) {
      // ignore
    }
    console.log(`Yasin CLI v${version}`);
  }

  printGlobalHelp() {
    let version = '1.0.0';
    try {
      const pkgPath = path.join(__dirname, '..', '..', 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        version = pkg.version || version;
      }
    } catch (e) {
      // ignore
    }

    console.log(`Yasin CLI - v${version}`);
    console.log(`Description: Yasin CLI is a modular, extensible command line interface tool.\n`);
    console.log(`Usage: yasin <command> [arguments] [options]\n`);
    console.log(`Commands:`);

    let maxLen = 0;
    this.commands.forEach((_, name) => {
      if (name.length > maxLen) maxLen = name.length;
    });

    this.commands.forEach((cmd, name) => {
      const paddedName = name.padEnd(maxLen + 4, ' ');
      console.log(`  ${paddedName}${cmd.description || ''}`);
    });

    console.log(`\nGlobal Options:`);
    console.log(`  -h, --help     Show help information`);
    console.log(`  -v, --version  Show version information`);
    console.log(`      --json     Emit machine-readable JSON (supported commands only)`);
  }

  printCommandHelp(command) {
    console.log(`Command: ${command.name}`);
    console.log(`Description: ${command.description || 'No description provided.'}\n`);

    const argsHelp = (command.args || []).map(arg => {
      return arg.required ? `<${arg.name}>` : `[${arg.name}]`;
    }).join(' ');

    console.log(`Usage: yasin ${command.name} ${argsHelp} [options]\n`);

    if (command.args && command.args.length > 0) {
      console.log(`Arguments:`);
      let maxLen = 0;
      command.args.forEach(arg => {
        if (arg.name.length > maxLen) maxLen = arg.name.length;
      });

      command.args.forEach(arg => {
        const reqStr = arg.required ? '(Required)' : '(Optional)';
        const paddedName = arg.name.padEnd(maxLen + 4, ' ');
        console.log(`  ${paddedName}${arg.description || ''} ${reqStr}`);
      });
      console.log();
    }

    if (command.options && command.options.length > 0) {
      console.log(`Options:`);
      let maxLen = 0;
      command.options.forEach(opt => {
        const fullOptName = `${opt.alias ? `${opt.alias}, ` : ''}${opt.name}`;
        if (fullOptName.length > maxLen) maxLen = fullOptName.length;
      });

      command.options.forEach(opt => {
        const fullOptName = `${opt.alias ? `${opt.alias}, ` : ''}${opt.name}`;
        const paddedName = fullOptName.padEnd(maxLen + 4, ' ');
        const defStr = opt.default !== undefined ? `(Default: ${opt.default})` : '';
        console.log(`  ${paddedName}${opt.description || ''} ${defStr}`);
      });
      console.log();
    }

    if (command.supportsJson) {
      console.log('  --json         Emit machine-readable JSON');
    }
  }
}

module.exports = CommandRegistry;
