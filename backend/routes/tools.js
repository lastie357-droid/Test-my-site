const express = require('express');
const router = express.Router();
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * GET /api/tools/list
 * List all available security tools
 */
router.get('/list', (req, res) => {
  const tools = [
    {
      name: 'Hydra',
      category: 'Brute Force',
      description: 'Fast network logon cracker',
      installed: isToolInstalled('hydra'),
      website: 'https://github.com/vanhauser-thc/thc-hydra'
    },
    {
      name: 'Medusa',
      category: 'Brute Force',
      description: 'Parallel network login auditor',
      installed: isToolInstalled('medusa'),
      website: 'https://foofus.net/goons/jmk/medusa/medusa.html'
    },
    {
      name: 'Burp Suite',
      category: 'Web Application Security',
      description: 'Comprehensive web application testing',
      installed: isToolInstalled('burpsuite'),
      website: 'https://portswigger.net/burp'
    },
    {
      name: 'SQLMap',
      category: 'SQL Injection',
      description: 'Automatic SQL injection tool',
      installed: isToolInstalled('sqlmap'),
      website: 'http://sqlmap.org/'
    },
    {
      name: 'Nmap',
      category: 'Network Scanning',
      description: 'Network exploration and security auditing',
      installed: isToolInstalled('nmap'),
      website: 'https://nmap.org/'
    },
    {
      name: 'Nikto',
      category: 'Web Server Scanning',
      description: 'Web server scanner',
      installed: isToolInstalled('nikto'),
      website: 'https://cirt.net/Nikto2'
    },
    {
      name: 'OWASP ZAP',
      category: 'Web Application Security',
      description: 'Web application security scanner',
      installed: isToolInstalled('zaproxy'),
      website: 'https://www.zaproxy.org/'
    },
    {
      name: 'Gobuster',
      category: 'Directory Enumeration',
      description: 'Directory and DNS busting tool',
      installed: isToolInstalled('gobuster'),
      website: 'https://github.com/OJ/gobuster'
    },
    {
      name: 'WPScan',
      category: 'WordPress Security',
      description: 'WordPress vulnerability scanner',
      installed: isToolInstalled('wpscan'),
      website: 'https://wpscan.com/'
    },
    {
      name: 'Hashcat',
      category: 'Password Cracking',
      description: 'Advanced password recovery utility',
      installed: isToolInstalled('hashcat'),
      website: 'https://hashcat.net/'
    },
    {
      name: 'John the Ripper',
      category: 'Password Cracking',
      description: 'Fast password cracker',
      installed: isToolInstalled('john'),
      website: 'https://www.openwall.com/john/'
    },
    {
      name: 'Metasploit',
      category: 'Exploitation Framework',
      description: 'Penetration testing framework',
      installed: isToolInstalled('msfconsole'),
      website: 'https://www.metasploit.com/'
    },
    {
      name: 'Wireshark',
      category: 'Network Analysis',
      description: 'Network protocol analyzer',
      installed: isToolInstalled('wireshark'),
      website: 'https://www.wireshark.org/'
    },
    {
      name: 'SSL Labs',
      category: 'SSL/TLS Testing',
      description: 'Online SSL/TLS certificate analyzer',
      installed: true,
      website: 'https://www.ssllabs.com/'
    },
    {
      name: 'Dirb',
      category: 'Web Application',
      description: 'Web content scanner',
      installed: isToolInstalled('dirb'),
      website: 'https://tools.kali.org/web-applications/dirb'
    }
  ];

  res.json(tools);
});

/**
 * POST /api/tools/run
 * Run a security tool
 */
router.post('/run', (req, res) => {
  try {
    const { tool, target, options } = req.body;

    if (!tool || !target) {
      return res.status(400).json({ error: 'Tool and target are required' });
    }

    // Build command based on tool
    let command = buildToolCommand(tool, target, options);

    if (!command) {
      return res.status(400).json({ error: `Unknown tool: ${tool}` });
    }

    console.log(`Executing: ${command}`);

    // Execute command with timeout
    const result = execSync(command, { 
      timeout: 60000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    res.json({
      tool,
      target,
      command,
      output: result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({
      error: 'Tool execution failed',
      details: error.message,
      stderr: error.stderr ? error.stderr.toString() : undefined
    });
  }
});

/**
 * Helper function to check if tool is installed
 */
function isToolInstalled(toolName) {
  try {
    execSync(`which ${toolName} 2>/dev/null`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper function to build tool commands
 */
function buildToolCommand(tool, target, options = {}) {
  const commands = {
    'hydra': `hydra -l admin -P /usr/share/wordlists/rockyou.txt ${target} http-post`,
    'nmap': `nmap -sV -sC ${target}`,
    'nikto': `nikto -h ${target}`,
    'gobuster': `gobuster dir -u ${target} -w /usr/share/wordlists/dirb/common.txt`,
    'sqlmap': `sqlmap -u "${target}" --dbs`,
    'dirb': `dirb ${target} /usr/share/dirb/wordlists/common.txt`,
    'whois': `whois ${target}`,
    'dig': `dig ${target}`,
    'ping': `ping -c 4 ${target}`
  };

  return commands[tool.toLowerCase()];
}

/**
 * GET /api/tools/install/:toolName
 * Install a security tool
 */
router.get('/install/:toolName', (req, res) => {
  try {
    const toolName = req.params.toolName.toLowerCase();
    
    const installCommands = {
      'hydra': 'apt-get install -y hydra',
      'medusa': 'apt-get install -y medusa',
      'nmap': 'apt-get install -y nmap',
      'nikto': 'apt-get install -y nikto',
      'sqlmap': 'apt-get install -y sqlmap',
      'dirb': 'apt-get install -y dirb',
      'wpscan': 'apt-get install -y wpscan',
      'gobuster': 'apt-get install -y gobuster'
    };

    if (!installCommands[toolName]) {
      return res.status(400).json({ error: `Installation not supported for ${toolName}` });
    }

    res.json({
      tool: toolName,
      message: `To install ${toolName}, run: ${installCommands[toolName]}`,
      installCommand: installCommands[toolName]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
