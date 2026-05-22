#!/bin/bash

# Web Testing Dashboard - Tool Installation Script
# This script installs all supported security testing tools

set -e

echo "🔧 Installing Security Testing Tools..."
echo "======================================="

# Update system
echo "[*] Updating system packages..."
sudo apt update -y

# Brute Force Tools
echo "[*] Installing brute force tools..."
sudo apt install -y hydra medusa

# Network Scanning
echo "[*] Installing network tools..."
sudo apt install -y nmap dnsutils whois

# Web Scanning
echo "[*] Installing web scanning tools..."
sudo apt install -y nikto dirb

# Subdomain/Directory Enumeration
echo "[*] Installing enumeration tools..."
sudo apt install -y gobuster

# SQL Injection
echo "[*] Installing SQLMap..."
sudo apt install -y sqlmap

# Password Cracking
echo "[*] Installing password cracking tools..."
sudo apt install -y john hashcat aircrack-ng

# Network Analysis
echo "[*] Installing network analysis tools..."
sudo apt install -y wireshark tcpdump

# Database Tools
echo "[*] Installing database tools..."
sudo apt install -y sqlitedata

# Exploitation Frameworks
echo "[*] Installing Metasploit Framework..."
sudo apt install -y metasploit-framework || echo "Metasploit installation skipped"

# Web Testing
echo "[*] Installing web testing tools..."
sudo apt install -y curl wget

# SSL/TLS Testing
echo "[*] Installing SSL testing tools..."
sudo apt install -y sslscan || echo "SSLScan not available"

# Proxy Tools
echo "[*] Installing proxy tools..."
sudo apt install -y mitmproxy || echo "mitmproxy not available"

# Fuzzing
echo "[*] Installing fuzzing tools..."
sudo apt install -y wfuzz || echo "wfuzz not available"

# Code Analysis
echo "[*] Installing code analysis tools..."
sudo apt install -y checksec || echo "checksec not available"

echo ""
echo "✅ Installation Complete!"
echo ""
echo "Installed Tools:"
echo "==============="

# List installed tools
which hydra > /dev/null && echo "✓ Hydra (Brute Force)"
which medusa > /dev/null && echo "✓ Medusa (Brute Force)"
which nmap > /dev/null && echo "✓ Nmap (Network Scanning)"
which nikto > /dev/null && echo "✓ Nikto (Web Scanning)"
which dirb > /dev/null && echo "✓ Dirb (Directory Enumeration)"
which gobuster > /dev/null && echo "✓ Gobuster (Directory Enumeration)"
which sqlmap > /dev/null && echo "✓ SQLMap (SQL Injection)"
which john > /dev/null && echo "✓ John the Ripper (Password Cracking)"
which hashcat > /dev/null && echo "✓ Hashcat (Password Cracking)"
which wireshark > /dev/null && echo "✓ Wireshark (Network Analysis)"
which msfconsole > /dev/null && echo "✓ Metasploit Framework"
which curl > /dev/null && echo "✓ Curl (HTTP Client)"
which wget > /dev/null && echo "✓ Wget (File Download)"

echo ""
echo "⚠️  Manual Installations Recommended:"
echo "===================================="
echo ""
echo "1. Burp Suite Community:"
echo "   wget https://portswigger.net/burp/communitydownload"
echo "   chmod +x burpsuite_community_linux_*.sh"
echo "   ./burpsuite_community_linux_*.sh"
echo ""
echo "2. OWASP ZAP:"
echo "   wget https://github.com/zaproxy/zaproxy/releases/download/v2.12.0/ZAP_2.12.0_Linux.tar.gz"
echo "   tar xzf ZAP_2.12.0_Linux.tar.gz"
echo ""
echo "3. Nessus:"
echo "   Download from https://www.tenable.com/downloads/nessus"
echo "   sudo dpkg -i Nessus-*.deb"
echo ""

echo "Next Steps:"
echo "==========="
echo "1. Start the server: npm start"
echo "2. Open: http://localhost:3000"
echo "3. Begin security testing!"
echo ""
