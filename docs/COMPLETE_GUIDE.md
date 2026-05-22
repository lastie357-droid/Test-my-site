# Web Testing Dashboard - Complete Setup & Documentation

## Table of Contents
1. [Quick Start](#quick-start)
2. [Features](#features)
3. [Installation](#installation)
4. [Security Tools Overview](#security-tools-overview)
5. [Vulnerability Testing Guide](#vulnerability-testing-guide)
6. [API Documentation](#api-documentation)
7. [Configuration](#configuration)
8. [Best Practices](#best-practices)

---

## Quick Start

### Prerequisites
- Node.js 14+ 
- npm or yarn
- Linux/macOS (Ubuntu recommended)
- Basic knowledge of web security

### Installation Steps

1. **Install Dependencies**
   ```bash
   cd /workspaces/Test-my-site
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   # Server runs on http://localhost:3000
   ```

3. **Access the Dashboard**
   ```bash
   Open http://localhost:3000 in your browser
   ```

4. **Install Security Tools**
   ```bash
   npm run install-tools
   # Or manually: bash backend/setup-tools.sh
   ```

---

## Features

### 1. Dashboard
- **Login Testing**: Test credentials against target websites
- **Live Web Preview**: See webpage screenshots in real-time
- **Security Analysis**: Automatic vulnerability scanning
- **HTML Inspector**: View and analyze page source code

### 2. Security Tools
- 15+ pre-configured security testing tools
- One-click tool execution
- Real-time output display
- Support for custom parameters

### 3. Reporting
- Automatic report generation
- Vulnerability documentation
- Severity classification
- Export capabilities

### 4. Documentation
- Complete API reference
- Tool configuration guides
- Vulnerability testing tutorials
- Best practices for security testing

---

## Installation

### 1. System Dependencies (Ubuntu/Debian)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install security tools
sudo apt install -y \
  hydra medusa nmap nikto sqlmap dirb gobuster \
  whois dnsutils hashcat john aircrack-ng \
  metasploit-framework wireshark tcpdump

# Optional: Burp Suite Community
wget https://portswigger.net/burp/communitydownload
chmod +x burpsuite_community_linux_*.sh
./burpsuite_community_linux_*.sh
```

### 2. Node Dependencies

```bash
npm install
npm install -g nodemon # For development
```

### 3. Project Structure

```
/workspaces/Test-my-site/
├── backend/
│   ├── server.js                 # Main server
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── preview.js           # Preview routes
│   │   ├── tools.js             # Tool execution
│   │   └── reports.js           # Report generation
│   └── setup-tools.sh           # Tool installation script
├── frontend/
│   ├── index.html               # Dashboard UI
│   ├── styles.css               # Styling
│   └── script.js                # Client-side logic
├── docs/                        # Documentation
├── tools-config/                # Tool configurations
└── reports/                     # Generated reports
```

---

## Security Tools Overview

### Brute Force Tools

#### Hydra
- **Purpose**: Network logon cracker (HTTP, FTP, SSH, etc.)
- **Installation**: `sudo apt install hydra`
- **Usage**:
  ```bash
  hydra -l username -P wordlist.txt example.com http-post
  ```

#### Medusa
- **Purpose**: Parallel network login auditor
- **Installation**: `sudo apt install medusa`
- **Usage**:
  ```bash
  medusa -h 192.168.1.1 -u admin -P wordlist.txt -M http
  ```

### Web Scanning Tools

#### Nikto
- **Purpose**: Web server scanner
- **Installation**: `sudo apt install nikto`
- **Usage**:
  ```bash
  nikto -h example.com -p 80
  ```

#### OWASP ZAP
- **Purpose**: Web application security scanner
- **Installation**: `sudo apt install zaproxy`
- **Usage**: GUI-based or API endpoints

#### Burp Suite
- **Purpose**: Comprehensive web app testing
- **Installation**: Download from portswigger.net
- **Features**: Proxy, Scanner, Intruder, Repeater

### Network Tools

#### Nmap
- **Purpose**: Network mapping and scanning
- **Installation**: `sudo apt install nmap`
- **Common Scans**:
  ```bash
  nmap -sV example.com           # Service version detection
  nmap -sC example.com           # Default script scan
  nmap -p- example.com           # All ports
  nmap -O example.com            # OS detection
  ```

### SQL Injection Tools

#### SQLMap
- **Purpose**: Automated SQL injection detection
- **Installation**: `sudo apt install sqlmap`
- **Usage**:
  ```bash
  sqlmap -u "http://example.com/page?id=1" --dbs
  ```

### Directory Enumeration

#### Gobuster
- **Purpose**: Directory and DNS busting
- **Installation**: `sudo apt install gobuster`
- **Usage**:
  ```bash
  gobuster dir -u http://example.com -w wordlist.txt
  ```

#### Dirb
- **Purpose**: Web content scanner
- **Installation**: `sudo apt install dirb`
- **Usage**:
  ```bash
  dirb http://example.com /usr/share/dirb/wordlists/common.txt
  ```

### Password Cracking

#### John the Ripper
- **Purpose**: Fast password cracker
- **Installation**: `sudo apt install john`
- **Usage**:
  ```bash
  john --format=sha512crypt hashes.txt
  ```

#### Hashcat
- **Purpose**: Advanced password recovery
- **Installation**: `sudo apt install hashcat`
- **Usage**:
  ```bash
  hashcat -m 1400 hashes.txt wordlist.txt
  ```

### Exploitation Frameworks

#### Metasploit
- **Purpose**: Penetration testing framework
- **Installation**: `sudo apt install metasploit-framework`
- **Usage**:
  ```bash
  msfconsole
  search exploit
  use module/exploit/...
  ```

### Network Analysis

#### Wireshark
- **Purpose**: Network protocol analyzer
- **Installation**: `sudo apt install wireshark`
- **Usage**: GUI-based network packet analysis

---

## Vulnerability Testing Guide

### 1. SQL Injection Testing

**Steps**:
1. Identify input fields (login, search, filters)
2. Test with SQL payloads: `' OR '1'='1`
3. Analyze error messages
4. Use SQLMap for automated testing

**Prevention**:
- Use prepared statements
- Input validation
- Error message filtering

### 2. Cross-Site Scripting (XSS)

**Testing Methods**:
```javascript
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg/onload=alert('XSS')>
```

**Tools**:
- Burp Suite Scanner
- OWASP ZAP
- Manual testing with browser console

### 3. Brute Force Attacks

**Testing**:
```bash
# HTTP Login
hydra -l admin -P wordlist.txt example.com http-post

# SSH
hydra -l root -P wordlist.txt ssh://192.168.1.1

# FTP
hydra -l admin -P wordlist.txt ftp://example.com
```

### 4. Directory Traversal

**Testing**:
```
/admin
/admin/
/../admin
/..%2Fadmin
```

**Tools**:
- Gobuster
- Dirb
- Burp Suite Intruder

### 5. Security Headers Analysis

**Missing Headers to Check**:
- Content-Security-Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)
- X-XSS-Protection

**Testing**:
```bash
curl -I https://example.com | grep -i "security\|content\|x-"
```

### 6. SSL/TLS Testing

**Tools**:
- SSL Labs (ssllabs.com)
- Nmap with SSL scripts
- Testssl.sh

**Test Coverage**:
- Certificate validity
- Cipher strength
- Protocol versions
- HSTS headers

### 7. Authentication Testing

**Areas to Test**:
- Credential submission
- Session management
- Password policies
- Account lockout
- Multi-factor authentication

### 8. API Testing

**Tools**:
- Burp Suite
- Postman
- OWASP ZAP API scanning

**Test Methods**:
- Authentication bypass
- Rate limiting
- Input validation
- Error handling

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/test-login
Test login credentials against a target domain

**Request**:
```json
{
  "domain": "https://example.com",
  "username": "admin",
  "password": "password123",
  "loginUrl": "https://example.com/login",
  "usernameSelector": "#username",
  "passwordSelector": "#password",
  "submitSelector": "button[type='submit']"
}
```

**Response**:
```json
{
  "success": true,
  "sessionId": "abc123def",
  "url": "https://example.com/dashboard",
  "message": "Login successful"
}
```

### Preview Endpoints

#### POST /api/preview/screenshot
Capture a screenshot of a webpage

**Request**:
```json
{
  "url": "https://example.com",
  "sessionId": "abc123def"
}
```

**Response**:
```json
{
  "screenshot": "data:image/png;base64,...",
  "url": "https://example.com",
  "title": "Page Title"
}
```

#### POST /api/preview/analyze
Analyze webpage for security issues

**Request**:
```json
{
  "url": "https://example.com"
}
```

**Response**:
```json
{
  "url": "https://example.com",
  "issues": [
    {
      "severity": "medium",
      "type": "Missing Security Header",
      "header": "HSTS",
      "recommendation": "Add Strict-Transport-Security header"
    }
  ],
  "isSecure": true
}
```

### Tools Endpoints

#### GET /api/tools/list
List all available security tools

**Response**:
```json
[
  {
    "name": "Nmap",
    "category": "Network Scanning",
    "description": "Network exploration tool",
    "installed": true,
    "website": "https://nmap.org/"
  }
]
```

#### POST /api/tools/run
Execute a security tool

**Request**:
```json
{
  "tool": "nmap",
  "target": "192.168.1.1",
  "options": {}
}
```

**Response**:
```json
{
  "tool": "nmap",
  "target": "192.168.1.1",
  "command": "nmap -sV 192.168.1.1",
  "output": "Starting Nmap..."
}
```

### Reports Endpoints

#### POST /api/reports/create
Create a security test report

**Request**:
```json
{
  "testName": "Vulnerability Assessment",
  "domain": "example.com",
  "findings": [
    "XSS vulnerability in login field",
    "Missing HSTS header",
    "Weak password policy"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "reportId": "abc123",
  "fileName": "report-123456.json"
}
```

---

## Configuration

### Environment Variables

Create `.env` file:
```
PORT=3000
NODE_ENV=development
API_TIMEOUT=30000
TOOL_TIMEOUT=60000
```

### Tool Configuration Files

Located in `/tools-config/`:
- `hydra.conf` - Hydra configuration
- `nmap.conf` - Nmap profiles
- `burp.conf` - Burp Suite preferences

---

## Best Practices

### 1. Legal & Ethical
- ✅ Always get written permission
- ✅ Scope testing clearly
- ✅ Document all testing
- ❌ Never access unauthorized systems
- ❌ Don't disrupt production systems

### 2. Testing Methodology
- Start with reconnaissance
- Move to scanning
- Perform enumeration
- Test for vulnerabilities
- Document findings
- Provide recommendations

### 3. Tool Usage
- Use updated tool versions
- Understand tool limitations
- Combine multiple tools
- Verify findings manually
- Keep audit logs

### 4. Security Testing Workflow

```
1. Reconnaissance
   ├── WHOIS lookup
   ├── DNS enumeration
   └── Directory discovery

2. Scanning
   ├── Network scanning (Nmap)
   ├── Web scanning (Nikto)
   └── Service identification

3. Enumeration
   ├── User enumeration
   ├── Directory/file enumeration
   └── Service version detection

4. Vulnerability Analysis
   ├── Manual testing
   ├── Automated scanning
   └── Configuration review

5. Exploitation (if authorized)
   ├── Proof of concept
   ├── Impact assessment
   └── Documentation

6. Reporting
   ├── Executive summary
   ├── Detailed findings
   ├── Recommendations
   └── Remediation timeline
```

### 5. Wordlist Management
- `/usr/share/wordlists/` - Default location
- `rockyou.txt` - Common passwords
- `common.txt` - Directory names
- `dirbuster/` - Web content discovery

### 6. Common Commands Reference

**Reconnaissance**:
```bash
whois example.com
dig example.com
nslookup example.com
curl -I https://example.com
```

**Network Scanning**:
```bash
nmap -sn 192.168.1.0/24        # Ping scan
nmap -sV 192.168.1.1           # Version detection
nmap -A 192.168.1.1            # Aggressive scan
```

**Web Scanning**:
```bash
nikto -h example.com
dirb http://example.com /wordlist
gobuster dir -u http://example.com -w /wordlist
```

**Exploitation**:
```bash
sqlmap -u "http://example.com/?id=1" --dbs
hydra -l user -P wordlist.txt example.com http-get
```

---

## Troubleshooting

### Tools Not Found
```bash
# Check if tool is installed
which nmap
which hydra

# Install missing tools
sudo apt install tool-name

# Update tool list in API
npm run install-tools
```

### Server Won't Start
```bash
# Check port 3000 is available
lsof -i :3000

# Kill process on port
kill -9 <PID>

# Try different port
PORT=3001 npm start
```

### Permission Denied
```bash
# Some tools require sudo
sudo usermod -aG kalilinux $USER

# Or run server with sudo (not recommended)
sudo npm start
```

---

## Support & Resources

- **Nmap**: https://nmap.org/docs/
- **OWASP**: https://owasp.org/
- **Burp Suite**: https://portswigger.net/burp/documentation
- **SANS**: https://www.sans.org/
- **HackTheBox**: https://www.hackthebox.com/
- **TryHackMe**: https://tryhackme.com/

---

**Last Updated**: May 2024
**Version**: 1.0.0
