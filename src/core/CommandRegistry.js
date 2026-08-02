const path = require('path');
const fs = require('fs');

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
    // 1. Extract global flags first if any
    const hasHelp = rawArgs.includes('--help') || rawArgs.includes('-h');
    const hasVersion = rawArgs.includes('--version') || rawArgs.includes('-v');

    // Find the command name: first argument that doesn't start with '-'
    let cmdName = null;
    let cmdIndex = -1;
    for (let i = 0; i < rawArgs.length; i++) {
      if (!rawArgs[i].startsWith('-')) {
        cmdName = rawArgs[i];
        cmdIndex = i;
        break;
      }
    }

    // 2. Handle --version / -v globally
    if (hasVersion && !cmdName) {
      this.printVersion();
      process.exit(0);
      return;
    }

    // 3. Handle --help / -h or no command globally
    if (!cmdName) {
      this.printGlobalHelp();
      process.exit(0);
      return;
    }

    // 4. Retrieve registered command
    const command = this.commands.get(cmdName);
    if (!command) {
      console.error(`Error: Unknown command "${cmdName}".\n`);
      this.printGlobalHelp();
      process.exit(1);
      return;
    }

    // Slice arguments for the command
    const commandRawArgs = [
      ...rawArgs.slice(0, cmdIndex),
      ...rawArgs.slice(cmdIndex + 1)
    ];

    // 5. Parse command-specific arguments and options
    const parsed = command.parse(commandRawArgs);

    // 6. Handle command-specific help
    if (parsed.options.help || parsed.options.h) {
      this.printCommandHelp(command);
      process.exit(0);
      return;
    }

    // 7. Validate required arguments
    const commandArgsDef = command.args || [];
    const givenArgs = parsed.args;

    for (let i = 0; i < commandArgsDef.length; i++) {
      const argDef = commandArgsDef[i];
      if (argDef.required && (givenArgs[i] === undefined || givenArgs[i] === '')) {
        console.error(`Error: Missing required argument <${argDef.name}>.\n`);
        this.printCommandHelp(command);
        process.exit(1);
        return;
      }
    }

    // 8. Execute the command
    try {
      command.execute(givenArgs, parsed.options);
    } catch (err) {
      console.error(`Error executing command "${cmdName}":`, err.message);
      process.exit(1);
      return;
    }
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

    // Find length of longest command for pretty alignment
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
  }
}

module.exports = CommandRegistry;
