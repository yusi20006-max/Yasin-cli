const Command = require('../core/Command');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class DoctorCommand extends Command {
  constructor(configManager) {
    super({
      name: 'doctor',
      description: 'Run diagnostic health checks on the environment',
      options: [
        { name: '--fix', alias: '-f', type: 'boolean', description: 'Automatically fix repairable issues' }
      ]
    });
    this.configManager = configManager;
  }

  execute(args, options) {
    console.log('Running Yasin CLI Diagnostics...\n');

    const results = [];
    let issuesCount = 0;

    // Check 1: Node.js version compatibility
    const nodeVer = process.version;
    const major = parseInt(nodeVer.slice(1).split('.')[0], 10);
    const nodeCompatible = major >= 18;
    if (nodeCompatible) {
      results.push({ name: 'Node.js Version', status: 'pass', msg: `${nodeVer} (Compatible)` });
    } else {
      results.push({ name: 'Node.js Version', status: 'fail', msg: `${nodeVer} (Legacy, recommended >= v18.x)` });
      issuesCount++;
    }

    // Check 2: OS compatibility
    const platform = process.platform;
    let osName = platform;
    const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
    if (isTermux) {
      osName = 'termux';
    }
    results.push({ name: 'OS Platform', status: 'pass', msg: `${osName} (${os.release()} ${os.arch()})` });

    // Check 3: Config Directory permission
    const configDir = this.configManager.configDir;
    let configStatus = 'pass';
    let configMsg = `${configDir} (Writable)`;
    try {
      this.configManager.ensureDirectoryExists();
      fs.accessSync(configDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (e) {
      configStatus = 'fail';
      configMsg = `${configDir} (Read/Write access denied)`;
      issuesCount++;
    }
    results.push({ name: 'Config Directory', status: configStatus, msg: configMsg });

    // Check 4: Plugin Directory permission
    const pluginDir = path.join(this.configManager.configDir, 'plugins');
    let pluginStatus = 'pass';
    let pluginMsg = `${pluginDir} (Writable)`;
    let pluginFixable = false;

    if (!fs.existsSync(pluginDir)) {
      pluginStatus = 'fail';
      pluginMsg = `${pluginDir} (Directory does not exist)`;
      pluginFixable = true;
      issuesCount++;
    } else {
      try {
        fs.accessSync(pluginDir, fs.constants.R_OK | fs.constants.W_OK);
      } catch (e) {
        pluginStatus = 'fail';
        pluginMsg = `${pluginDir} (Read/Write access denied)`;
        issuesCount++;
      }
    }
    results.push({ name: 'Plugin Directory', status: pluginStatus, msg: pluginMsg, fixable: pluginFixable, fixType: 'create_plugin_dir' });

    // Check 5: Git dependency
    let gitVer = '';
    let gitStatus = 'pass';
    try {
      gitVer = child_process.execSync('git --version', { stdio: 'pipe' }).toString().trim();
      gitStatus = 'pass';
    } catch (e) {
      gitStatus = 'fail';
      gitVer = 'git is not installed or not in PATH';
      issuesCount++;
    }
    results.push({ name: 'Git Dependency', status: gitStatus, msg: gitVer });

    // Print results
    results.forEach(res => {
      const sym = res.status === 'pass' ? '[✓]' : '[✗]';
      console.log(`${sym} ${res.name}: ${res.msg}`);
    });

    console.log();

    if (issuesCount === 0) {
      console.log('Status: All checks passed! No issues found.');
      return;
    }

    console.log(`Status: ${issuesCount} issue(s) found.`);

    // Auto-Healing
    if (options.fix) {
      console.log('\nAttempting auto-healing...');
      results.forEach(res => {
        if (res.status === 'fail' && res.fixable) {
          if (res.fixType === 'create_plugin_dir') {
            try {
              fs.mkdirSync(pluginDir, { recursive: true });
              console.log(`[✓] Created plugin directory: ${pluginDir}`);
              issuesCount--;
            } catch (err) {
              console.error(`[✗] Failed to create plugin directory: ${err.message}`);
            }
          }
        }
      });
      console.log();
      if (issuesCount === 0) {
        console.log('Status: All repairable issues fixed! No issues remaining.');
      } else {
        console.log(`Status: Auto-healing complete. ${issuesCount} issue(s) remaining.`);
      }
    } else {
      const fixableResults = results.filter(res => res.status === 'fail' && res.fixable);
      if (fixableResults.length > 0) {
        console.log('Tip: Run "yasin doctor --fix" to automatically resolve repairable issues.');
      }
    }
  }
}

module.exports = DoctorCommand;
