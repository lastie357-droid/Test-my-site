# 🔐 Web Testing Dashboard - Comprehensive Security Testing Suite

A complete web application testing platform with integrated security tools, live preview capabilities, and automated vulnerability scanning.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- Linux/macOS (Ubuntu recommended)
- npm or yarn

### Installation & Running

```bash
# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:3000
```

### First Steps

1. **Open Dashboard**: http://localhost:3000
2. **Enter Target Domain**: e.g., `https://example.com`
3. **Test Login**: Enter credentials (optional)
4. **View Live Preview**: See real-time screenshots
5. **Analyze Security**: Automatic vulnerability detection
6. **Run Security Tools**: Execute 15+ integrated tools
7. **Generate Reports**: Document all findings

---

## ✨ Features

### 📊 Dashboard
- ✅ Login credential testing with live preview
- ✅ Real-time website screenshots
- ✅ Automatic security analysis
- ✅ HTML source code inspection
- ✅ Session management

### 🛠️ Security Tools (15+)
- **Brute Force**: Hydra, Medusa
- **Network Scanning**: Nmap, Netstat
- **Web Scanning**: Nikto, Burp Suite, OWASP ZAP
- **Enumeration**: Gobuster, Dirb
- **SQL Injection**: SQLMap
- **Password Cracking**: John, Hashcat
- **And 100+ more tools available**

### 📋 Reporting
- Automatic vulnerability documentation
- Severity classification
- Detailed findings and recommendations
- Professional report generation

### 📚 Documentation
- Complete API reference
- Tool configuration guides
- OWASP Top 10 testing methodology
- Best practices & security guidelines

---

## 📁 Project Structure

```
/workspaces/Test-my-site/
├── backend/
│   ├── server.js                 # Express server
│   ├── routes/
│   │   ├── auth.js              # Authentication & login testing
│   │   ├── preview.js           # Website preview & analysis
│   │   ├── tools.js             # Security tool execution
│   │   └── reports.js           # Report generation
│   └── setup-tools.sh           # Automated tool installation
├── frontend/
│   ├── index.html               # Dashboard interface
│   ├── styles.css               # Responsive styling
│   └── script.js                # Client-side functionality
├── docs/
│   ├── COMPLETE_GUIDE.md        # Full documentation
│   ├── VULNERABILITY_TESTING.md # OWASP Top 10 testing
│   └── TOOLS_CONFIGURATION.md   # Detailed tool guides
├── package.json                 # Dependencies
└── reports/                     # Generated test reports
```

---

## 🔧 Installation & Setup

### 1. Install System Dependencies

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install security tools
sudo apt install -y \
  hydra medusa nmap nikto sqlmap dirb gobuster \
  whois dnsutils hashcat john aircrack-ng curl wget
```

### 2. Install Node Dependencies

```bash
cd /workspaces/Test-my-site
npm install
```

### 3. Install Additional Security Tools (Optional)

```bash
# Run automated setup script
bash backend/setup-tools.sh

# Or manually install specific tools
sudo apt install metasploit-framework wireshark tcpdump
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start

# Server will be available at http://localhost:3000
```

---

## 🎯 Usage Examples

### Testing a Website

1. **Enter Domain**: https://example.com
2. **Test Login** (Optional):
   - Username: admin
   - Password: password123
3. **View Preview**: Take screenshot button
4. **Analyze**: Click "Analyze Security"
5. **Review Findings**: See detected vulnerabilities

### Running Security Tools

```bash
# Via Dashboard
1. Go to Tools tab
2. Select tool (Nmap, SQLMap, etc.)
3. Enter target
4. Click Execute Tool
5. View results

# Via Command Line
curl -X POST http://localhost:3000/api/tools/run \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "nmap",
    "target": "192.168.1.1",
    "options": {}
  }'
```

### Generating Reports

```bash
# Via Dashboard
1. Go to Reports tab
2. Fill in test information
3. Enter findings
4. Click "Create Report"

# Via API
curl -X POST http://localhost:3000/api/reports/create \
  -H "Content-Type: application/json" \
  -d '{
    "testName": "Vulnerability Assessment",
    "domain": "example.com",
    "findings": ["XSS vulnerability", "Missing security headers"]
  }'
```

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/test-login` - Test login credentials
- `GET /api/auth/sessions` - List active sessions
- `DELETE /api/auth/session/:id` - Delete session

### Preview & Analysis
- `POST /api/preview/screenshot` - Capture webpage screenshot
- `POST /api/preview/html` - Get page HTML content
- `POST /api/preview/analyze` - Analyze security issues

### Tools
- `GET /api/tools/list` - List all available tools
- `POST /api/tools/run` - Execute a security tool
- `GET /api/tools/install/:name` - Get installation info

### Reports
- `POST /api/reports/create` - Create new report
- `GET /api/reports/list` - List all reports
- `GET /api/reports/:id` - Get specific report
- `DELETE /api/reports/:id` - Delete report

---

## 🛡️ Security Testing Workflow

### Phase 1: Reconnaissance
```bash
# DNS and domain information
whois example.com
dig example.com
nslookup example.com
```

### Phase 2: Scanning
```bash
# Network and port scanning
nmap -sV example.com
nikto -h example.com
```

### Phase 3: Enumeration
```bash
# Directory and service enumeration
gobuster dir -u http://example.com -w wordlist.txt
dirb http://example.com
```

### Phase 4: Vulnerability Analysis
```bash
# Test for specific vulnerabilities
sqlmap -u "http://example.com/?id=1" --dbs
hydra -l admin -P wordlist.txt example.com http-post
```

### Phase 5: Reporting
```bash
# Document findings in dashboard
# Create comprehensive report with recommendations
```

---

## 🧪 Testing for OWASP Top 10

### 1. Injection
```bash
sqlmap -u "http://example.com/page?id=1" --dbs
```

### 2. Broken Authentication
```bash
hydra -l admin -P wordlist.txt example.com http-post
```

### 3. Sensitive Data Exposure
```bash
curl -I https://example.com | grep -i "security"
```

### 4. XML External Entity (XXE)
```
Payload: <?xml version="1.0"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<foo>&xxe;</foo>
```

### 5. Broken Access Control
```
Test: Access user resources with different user IDs
Endpoint: /api/user/123 → try /api/user/456
```

### 6. Security Misconfiguration
```bash
# Check headers and defaults
curl -I https://example.com
nmap --script vuln example.com
```

### 7. Cross-Site Scripting (XSS)
```javascript
Payloads: <script>alert('XSS')</script>
          <img src=x onerror=alert('XSS')>
```

### 8. Insecure Deserialization
```
Test: Intercept serialized objects
Modify: Object properties for privilege escalation
```

### 9. Using Components with Known Vulnerabilities
```bash
npm audit
```

### 10. Insufficient Logging & Monitoring
```
Check: Application and access logs
Verify: Critical events are logged
```

---

## 📖 Documentation

Complete documentation is available in the `/docs` folder:

- **[COMPLETE_GUIDE.md](docs/COMPLETE_GUIDE.md)** - Full setup and usage guide
- **[VULNERABILITY_TESTING.md](docs/VULNERABILITY_TESTING.md)** - OWASP Top 10 testing methodology
- **[TOOLS_CONFIGURATION.md](docs/TOOLS_CONFIGURATION.md)** - Detailed tool configuration and usage

---

## 🎓 Learning Resources

### Official Documentation
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Nmap Documentation](https://nmap.org/docs/)
- [Burp Suite Docs](https://portswigger.net/burp/documentation)
- [SQLMap Wiki](https://github.com/sqlmapproject/sqlmap/wiki)

### Practice Platforms
- [HackTheBox](https://www.hackthebox.com/) - Real penetration testing scenarios
- [TryHackMe](https://tryhackme.com/) - Guided security training
- [DVWA](http://dvwa.co.uk/) - Vulnerable web application
- [WebGoat](https://owasp.org/www-project-webgoat/) - OWASP training
- [Juice Shop](https://owasp.org/www-project-juice-shop/) - Modern vulnerable app

---

## ⚠️ Legal & Ethical Guidelines

**IMPORTANT**: Only test systems you own or have explicit written permission to test.

### Required Checklist
- ✅ Get written authorization
- ✅ Define testing scope clearly
- ✅ Establish communication channel
- ✅ Document all testing activities
- ❌ Never test without permission
- ❌ Don't disrupt production systems
- ❌ Don't access unauthorized data

---

## 🔍 Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is available
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Try different port
PORT=3001 npm start
```

### Tools Not Found
```bash
# Verify tool is installed
which nmap

# Install missing tool
sudo apt install nmap

# Update tool list
npm run install-tools
```

### Permission Denied
```bash
# Run with sudo (not recommended)
sudo npm start

# Or add user to group
sudo usermod -aG kalilinux $USER
```

---

## 📊 System Requirements

### Minimum
- CPU: 2 cores
- RAM: 2GB
- Storage: 5GB
- Network: Internet connection

### Recommended
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 20GB+
- OS: Ubuntu 20.04+ or Debian 11+

---

## 🤝 Contributing

Contributions are welcome! Areas to help:
- Additional tool integrations
- Enhanced vulnerability detection
- Improved reporting features
- Documentation improvements
- Bug fixes and optimizations

---

## 📝 License

This project is provided for educational and authorized security testing purposes only.

---

## 🆘 Support

### Getting Help
- Check [docs/](docs/) for detailed guides
- Review API documentation in dashboard
- Check tool-specific documentation links
- Search for similar issues in documentation

### Common Issues
See [COMPLETE_GUIDE.md#troubleshooting](docs/COMPLETE_GUIDE.md) for solutions.

---

## 🎉 Summary

This Web Testing Dashboard provides a complete security testing environment with:
- ✅ Intuitive web interface
- ✅ 15+ integrated security tools
- ✅ Real-time website preview
- ✅ Automated vulnerability detection
- ✅ Professional reporting
- ✅ Comprehensive documentation

**Start testing now**: `npm start` → http://localhost:3000

---

**Version**: 1.0.0  
**Last Updated**: May 2024  
**Maintained By**: Security Testing Team