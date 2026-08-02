class Command {
  constructor(options = {}) {
    this.name = options.name || '';
    this.description = options.description || '';
    this.args = options.args || []; // e.g., [{ name: 'key', required: true, description: '...' }]
    this.options = options.options || []; // e.g., [{ name: 'port', alias: 'p', type: 'number', default: 3000, description: '...' }]
  }

  execute(args, options) {
    throw new Error('Command.execute must be implemented');
  }

  parse(rawArgs) {
    const parsedOpts = {};
    const parsedArgs = [];

    // Initialize option defaults
    for (const opt of this.options) {
      const cleanName = opt.name.replace(/^-+/, '');
      if (opt.default !== undefined) {
        parsedOpts[cleanName] = opt.default;
      } else if (opt.type === 'boolean') {
        parsedOpts[cleanName] = false;
      }
    }

    let i = 0;
    while (i < rawArgs.length) {
      const arg = rawArgs[i];

      if (arg.startsWith('-')) {
        let name = '';
        let value = null;

        if (arg.startsWith('--')) {
          if (arg.includes('=')) {
            const index = arg.indexOf('=');
            name = arg.slice(2, index);
            value = arg.slice(index + 1);
          } else {
            name = arg.slice(2);
          }
        } else {
          name = arg.slice(1);
        }

        // Find matching option definition by name or alias
        const optDef = this.options.find(opt => {
          const cleanName = opt.name.replace(/^-+/, '');
          const cleanAlias = opt.alias ? opt.alias.replace(/^-+/, '') : null;
          return cleanName === name || cleanAlias === name;
        });

        if (optDef) {
          const cleanName = optDef.name.replace(/^-+/, '');
          if (optDef.type === 'boolean') {
            parsedOpts[cleanName] = true;
          } else {
            // It needs a value
            if (value !== null) {
              parsedOpts[cleanName] = this.castType(value, optDef.type);
            } else if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('-')) {
              i++;
              parsedOpts[cleanName] = this.castType(rawArgs[i], optDef.type);
            } else {
              parsedOpts[cleanName] = optDef.default !== undefined ? optDef.default : true;
            }
          }
        } else {
          // Store unknown option with its literal name
          parsedOpts[name] = value !== null ? value : true;
        }
      } else {
        parsedArgs.push(arg);
      }
      i++;
    }

    return {
      args: parsedArgs,
      options: parsedOpts
    };
  }

  castType(val, type) {
    if (type === 'number') {
      const num = Number(val);
      return isNaN(num) ? val : num;
    }
    if (type === 'boolean') {
      return val === 'true' || val === true || val === '1';
    }
    return val;
  }
}

module.exports = Command;
