# Quick Start Guide - 5 Minutes to First Test

## Step 1: Prepare Your System (1 minute)

```bash
# Open terminal
cd /workspaces/Test-my-site

# Verify Node.js is installed
node --version  # Should be v14+
npm --version
```

## Step 2: Install Dependencies (2 minutes)

```bash
# Install Node packages
npm install

# Grab a coffee ☕ - this takes ~1 minute
```

## Step 3: Start the Dashboard (1 minute)

```bash
# Start server
npm start

# You should see:
# 🚀 Web Testing Dashboard running on http://localhost:3000
```

## Step 4: Access and Test (1 minute)

1. **Open Browser**: http://localhost:3000
2. **Enter Target**: https://example.com (or any website)
3. **Click Buttons**:
   - "Test Login" (optional - add credentials)
   - "Take Screenshot" (see the website)
   - "Analyze Security" (find vulnerabilities)

---

## 🎯 What You Can Do Now

### Test Login (with credentials)
```
Domain: https://example.com
Username: admin
Password: password123
Click: Test Login
```

### View Live Preview
```
1. Enter URL
2. Click "Take Screenshot"
3. See real-time webpage
```

### Analyze Security
```
1. Enter URL
2. Click "Analyze Security"
3. View security issues found
```

### Run Security Tools
```
1. Go to Tools tab
2. Select tool (Nmap, SQLMap, etc.)
3. Enter target IP or domain
4. Click "Execute Tool"
5. View output
```

### Create Report
```
1. Go to Reports tab
2. Enter test name: "My First Security Test"
3. Enter domain: example.com
4. Add findings
5. Click "Create Report"
```

---

## 📚 Next Steps

### Install Security Tools (Optional)

```bash
# Install all tools automatically
bash backend/setup-tools.sh

# Or install specific tools
sudo apt install nmap
sudo apt install nikto
sudo apt install sqlmap
```

### Read Full Documentation

- [COMPLETE_GUIDE.md](docs/COMPLETE_GUIDE.md) - Everything
- [VULNERABILITY_TESTING.md](docs/VULNERABILITY_TESTING.md) - How to test
- [TOOLS_CONFIGURATION.md](docs/TOOLS_CONFIGURATION.md) - Tool details

### Common First Tasks

1. **Scan a Network**
   - Tool: Nmap
   - Target: 192.168.1.0/24
   - Command: `nmap -sV 192.168.1.1`

2. **Test Web Server**
   - Tool: Nikto
   - Target: example.com
   - Command: `nikto -h example.com`

3. **Find Directories**
   - Tool: Gobuster
   - Target: example.com
   - Command: `gobuster dir -u http://example.com -w wordlist.txt`

4. **Test SQL Injection**
   - Tool: SQLMap
   - Target: example.com/?id=1
   - Command: `sqlmap -u "http://example.com/?id=1" --dbs`

---

## 🚀 Common Testing Workflow

### Quick Security Check (5 minutes)
```
1. Take screenshot
2. Analyze security
3. View HTML source
4. Review findings
5. Create quick report
```

### Comprehensive Test (30 minutes)
```
1. Nmap scan for open ports
2. Nikto web server scan
3. Gobuster directory enumeration
4. Manual testing of found areas
5. SQLMap for SQL injection
6. Generate detailed report
```

### Professional Assessment (1-2 hours)
```
1. Full reconnaissance
2. Network mapping
3. Service enumeration
4. Vulnerability testing
5. Authentication testing
6. Data exposure testing
7. API testing
8. Report & recommendations
```

---

## 💡 Pro Tips

### Use Keyboard Shortcuts
- Refresh page: F5
- Open console: F12
- Open network tab: F12 → Network

### Save Time
- Use limited wordlists for quick tests
- Start with port scan before vulnerability tests
- Run multiple tools in parallel

### Stay Organized
- Name reports clearly
- Document findings as you go
- Keep separate reports for different targets

---

## 🔍 Verify Installation

### Check Dashboard
- Navigate to: http://localhost:3000
- You should see the dashboard interface
- All tabs should be clickable

### Check API Health
```bash
curl http://localhost:3000/api/health

# Should return:
# {"status":"Server is running","timestamp":"2024-05-22T..."}
```

### Check Available Tools
```bash
# In dashboard:
1. Go to Tools tab
2. See list of available tools
3. Green "✅ Installed" = ready to use
4. Orange "⚠️ Not Installed" = needs setup
```

---

## 🎓 Learn By Doing

### Example 1: Test Your Own Website
```
1. Deploy a simple website locally
2. Enter its URL in dashboard
3. Take screenshot
4. Analyze security
5. Fix any issues found
6. Re-test
```

### Example 2: Use Practice App
```
1. Download DVWA (Damn Vulnerable Web Application)
2. Run locally
3. Test against it
4. Find all vulnerabilities
5. Learn how to fix them
```

### Example 3: Analyze Real Website (with permission)
```
1. Get written permission
2. Scan basic info (whois, DNS)
3. Scan open ports
4. Test web server
5. Look for common misconfigurations
6. Generate report
```

---

## ⚠️ Remember

- ✅ Only test systems you own or have permission for
- ✅ Document everything
- ✅ Get written authorization
- ✅ Start with non-destructive scans
- ❌ Never attack production systems
- ❌ Don't disrupt services
- ❌ Keep findings confidential

---

## 🆘 Troubleshooting

### Server won't start?
```bash
# Kill any process on port 3000
lsof -i :3000
kill -9 <PID>

# Try again
npm start
```

### Can't connect to http://localhost:3000?
```bash
# Check if server is running
# Look for: 🚀 Web Testing Dashboard running on http://localhost:3000

# Try different port
PORT=3001 npm start
```

### Tools not working?
```bash
# Install them
bash backend/setup-tools.sh

# Verify installation
which nmap
which nikto
```

---

## 📞 Get Help

1. Check [docs/](docs/) folder
2. Look at API documentation in dashboard
3. Read tool-specific guides
4. Check common troubleshooting

---

## 🎉 You're Ready!

You now have a fully functional security testing dashboard. Start with:

```bash
npm start
# Navigate to http://localhost:3000
# Pick a target
# Run a test
# Learn!
```

**Enjoy your security testing journey!** 🚀

---

**Time to first test**: ~5 minutes  
**Time to comprehensive setup**: ~15-30 minutes  
**Next Steps**: [COMPLETE_GUIDE.md](docs/COMPLETE_GUIDE.md)
