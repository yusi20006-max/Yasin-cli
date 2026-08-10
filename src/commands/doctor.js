const Command = require('../core/Command');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const AutomationResult = require('../output/AutomationResult');
const ExitCodes = require('../output/ExitCodes');

class DoctorCommand extends Command {
  constructor(configManager) {
    super({
      name: 'doctor',
      description: 'Run diagnostic health checks on the environment',
      supportsJson: true,
      options: [
        { name: '--fix', alias: '-f', type: 'boolean', description: 'Automatically fix repairable issues' }
      ]
    });
    this.configManager = configManager;
  }

  collectResults() {
    const results = [];

    const nodeVer = process.version;
    const major = parseInt(nodeVer.slice(1).split('.')[0], 10);
    results.push(major >= 18
      ? { name: 'Node.js Version', status: 'pass', msg: `${nodeVer} (Compatible)` }
      : { name: 'Node.js Version', status: 'fail', msg: `${nodeVer} (Legacy, recommended >= v18.x)` });

    const platform = process.platform;
    const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
    const osName = isTermux ? 'termux' : platform;
    results.push({ name: 'OS Platform', status: 'pass', msg: `${osName} (${os.release()} ${os.arch()})` });

    const configDir = this.configManager.configDir;
    try {
      this.configManager.ensureDirectoryExists();
      fs.accessSync(configDir, fs.constants.R_OK | fs.constants.W_OK);
      results.push({ name: 'Config Directory', status: 'pass', msg: `${configDir} (Writable)` });
    } catch (e) {
      results.push({ name: 'Config Directory', status: 'fail', msg: `${configDir} (Read/Write access denied)` });
    }

    const pluginDir = path.join(configDir, 'plugins');
    if (!fs.existsSync(pluginDir)) {
      results.push({
        name: 'Plugin Directory',
        status: 'fail',
        msg: `${pluginDir} (Directory does not exist)`,
        fixable: true,
        fixType: 'create_plugin_dir'
      });
    } else {
      try {
        fs.accessSync(pluginDir, fs.constants.R_OK | fs.constants.W_OK);
        results.push({ name: 'Plugin Directory', status: 'pass', msg: `${pluginDir} (Writable)` });
      } catch (e) {
        results.push({ name: 'Plugin Directory', status: 'fail', msg: `${pluginDir} (Read/Write access denied)` });
      }
    }

    try {
      const gitVer = child_process.execSync('git --version', { stdio: 'pipe' }).toString().trim();
      results.push({ name: 'Git Dependency', status: 'pass', msg: gitVer });
    } catch (e) {
      results.push({ name: 'Git Dependency', status: 'fail', msg: 'git is not installed or not in PATH' });
    }

    return results;
  }

  execute(args, options = {}) {
    let results = this.collectResults();
    let issuesCount = results.filter(res => res.status === 'fail').length;
    const repairActions = [];

    if (options.fix) {
      if (results.some(res => res.status === 'fail' && res.fixable)) {
        if (!options.json) console.log('\nAttempting auto-healing...');
      }

      results.forEach(res => {
        if (res.status === 'fail' && res.fixable && res.fixType === 'create_plugin_dir') {
          const pluginDir = path.join(this.configManager.configDir, 'plugins');
          try {
            fs.mkdirSync(pluginDir, { recursive: true });
            repairActions.push({ action: res.fixType, status: 'fixed', path: pluginDir });
            if (!options.json) console.log(`[✓] Created plugin directory: ${pluginDir}`);
          } catch (err) {
            repairActions.push({ action: res.fixType, status: 'failed', error: err.message });
            if (!options.json) console.error(`[✗] Failed to create plugin directory: ${err.message}`);
          }
        }
      });

      results = this.collectResults();
      issuesCount = results.filter(res => res.status === 'fail').length;
    }

    const data = {
      healthy: issuesCount === 0,
      issues: issuesCount,
      results,
      ...(options.fix ? { repairActions } : {})
    };

    const result = issuesCount === 0
      ? AutomationResult.success(data)
      : AutomationResult.failure(ExitCodes.GENERAL_ERROR, `${issuesCount} issue(s) found`, data);

    if (options.json) return result;

    console.log('Running Yasin CLI Diagnostics...\n');
    results.forEach(res => {
      const sym = res.status === 'pass' ? '[✓]' : '[✗]';
      console.log(`${sym} ${res.name}: ${res.msg}`);
    });
    console.log();

    if (issuesCount === 0) {
      if (options.fix && repairActions.length > 0) {
        console.log('Status: All repairable issues fixed! No issues remaining.');
      } else {
        console.log('Status: All checks passed! No issues found.');
      }
    } else {
      console.log(`Status: ${issuesCount} issue(s) found.`);
      if (options.fix) {
        console.log('Status: Auto-healing complete. ' + `${issuesCount} issue(s) remaining.`);
      } else if (results.some(res => res.status === 'fail' && res.fixable)) {
        console.log('Tip: Run "yasin doctor --fix" to automatically resolve repairable issues.');
      }
    }

    return result;
  }
}

module.exports = DoctorCommand;
