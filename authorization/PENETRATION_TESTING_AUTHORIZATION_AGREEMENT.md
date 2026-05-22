# PENETRATION TESTING AUTHORIZATION AGREEMENT

**Date**: May 22, 2026

## Between:

**Client/Owner**: Shabiki.com
- Company/Individual: Shabiki.com
- Address: [Client Address]
- City, State, ZIP: [Client City, State, ZIP]
- Country: [Client Country]

**Penetration Testing Firm**: HackDay Penetration Limited
- Address: 10960 Wilshire Blvd, Suite 1415
- City, State, ZIP: Los Angeles, CA 90024
- Country: United States of America

**Contact Person**: James Kariuki — Lead Penetration Tester
- Email: engagements@hackdaypenetration.com
- Phone: +254 722 300 146
- Emergency Hotline: +254 701 892 554

---

## 1. AUTHORIZATION

The Client (Shabiki.com) hereby grants **HackDay Penetration Limited** explicit, written authorization to conduct comprehensive security assessments, penetration testing, and vulnerability scanning against the web application and associated infrastructure of shabiki.com as defined in Section 2 below.

This document serves as the legally binding authorization for all testing activities described herein. The Client confirms that they are the lawful owner or duly authorized representative of the assets being tested.

---

## 2. SCOPE OF ASSESSMENT

### 2.1 In-Scope Targets

| Target | Description |
|--------|-------------|
| https://www.shabiki.com | Main web application |
| https://shabiki.com | Root domain |
| *.shabiki.com | All subdomains |
| api.shabiki.com or /api/* | API endpoints |
| DNS, Nameservers, Mail Servers | Associated infrastructure |
| Cloud/hosting infrastructure | All servers hosting the application |
| Third-party services/CDNs | All integrations essential to functionality |

### 2.2 Authorized Testing Techniques

#### Reconnaissance
- Port scanning (Nmap, Masscan)
- Service enumeration and fingerprinting
- DNS enumeration (dnsrecon, subfinder, dig)
- Subdomain discovery (Amass, Sublist3r, assetfinder)
- OSINT gathering (theHarvester, Maltego, Google Dorking)
- Directory and file fuzzing (ffuf, Gobuster, Dirb)
- Technology fingerprinting (WhatWeb, Wappalyzer, BuiltWith)

#### Web Application Testing
- SQL Injection (manual + automated via sqlmap)
- Cross-Site Scripting (XSS) — reflected, stored, DOM-based
- Cross-Site Request Forgery (CSRF)
- Server-Side Request Forgery (SSRF)
- XML External Entity (XXE) Injection
- Command Injection
- Local File Inclusion / Remote File Inclusion (LFI/RFI)
- Insecure Direct Object Reference (IDOR)
- Authentication bypass and session hijacking
- Privilege escalation (horizontal and vertical)
- Business logic flaws
- Server-Side Template Injection (SSTI)
- Prototype pollution
- Mass assignment
- JWT and token manipulation
- Race conditions

#### Infrastructure Testing
- Network vulnerability scanning (Nessus, OpenVAS)
- Misconfiguration analysis
- Default credential testing
- SSL/TLS assessment (testssl.sh, SSL Labs)
- Open port and service analysis

#### Advanced Exploitation
- Buffer overflow testing
- Deserialization attacks (PHP, Java, Python, .NET)
- Memory corruption testing
- Heap/stack overflow analysis

#### Credential Testing
- Password spraying (controlled, non-disruptive)
- Credential stuffing against test accounts only
- Brute force testing (rate-limited)

#### Automated Scanning
- Burp Suite Pro (manual + automated)
- Nuclei (template-based scanning)
- Nikto web server scanner
- Acunetix / Netsparker (if applicable)
- Custom fuzzers and exploit PoC scripts

---

## 3. OUT OF SCOPE / RESTRICTIONS

The following activities are strictly prohibited unless separately agreed in a written addendum:

| Activity | Reason |
|----------|--------|
| Denial of Service (DoS/DDoS) attacks | Risk of production downtime |
| Physical security assessments | Not covered under this scope |
| Destruction or corruption of production data | Read-only approach except where PoC requires minimal modification |
| Exfiltration of sensitive user data | Screenshots and sanitized PoC only |
| Public disclosure of findings | All findings remain confidential |
| Social engineering of non-consenting employees | Requires separate addendum |
| Testing outside agreed time windows | Unless emergency/KoE override is coordinated |

---

## 4. RULES OF ENGAGEMENT

### Testing Schedule
- 24 hours a day, 7 days a week — continuous engagement from start date to end date.

### Testing Infrastructure
HackDay Penetration Limited may conduct testing from:
- Internal lab IP range: [HackDay Internal IP Range — specify if applicable]
- Cloud-based VPS/AWS infrastructure
- Remote VPN connections
- No geographic restrictions apply

### Communication During Testing
- **Critical vulnerabilities (CVSS ≥ 9.0)**: Report immediately via emergency hotline: +254 701 892 554
- **High severity findings (CVSS 7.0–8.9)**: Report within 24 hours
- **Medium and low severity findings**: Include in final report

### Authentication
- **Test credentials for authenticated testing**: [List credentials here or attach separate sheet]
- If no credentials provided, testing limited to unauthenticated (black-box) assessment

### Rate Limiting & WAF
- HackDay shall respect standard rate-limiting mechanisms
- If aggressive scanning required (e.g., for WAF bypass testing), coordination occurs in advance with Client's technical POC
- Any IDS/IPS/WAF alerts triggered will be documented and explained in final report

### Technical Point of Contact (Client)
- **Name**: ___________________________
- **Title**: ___________________________
- **Email**: ___________________________
- **Phone**: ___________________________

---

## 5. DATA HANDLING & CONFIDENTIALITY

### Data Classification
All data accessed during testing is classified as **Client Confidential**.

### Use of Data
- Data shall be used solely for demonstrating proof of concept
- No data shall be copied, stored, or transmitted outside HackDay's secure environment except as necessary for report generation
- All PoC data shall be anonymized/sanitized before inclusion in final report

### Retention & Destruction
- All logs, screenshots, packet captures, and PoC artifacts shall be retained for the duration of engagement plus 90 days
- After 90 days, all data shall be securely destroyed (DoD-standard wipe or cryptographic shredding)
- Encrypted backups shall be purged within 120 days

### Non-Disclosure
- HackDay Penetration Limited and its employees shall not disclose any findings, vulnerabilities, or client data to any third party without explicit written consent
- This obligation survives termination of this Agreement

---

## 6. LIABILITY & INDEMNIFICATION

### Acknowledgment of Risk
The Client acknowledges that penetration testing inherently carries residual risk, including but not limited to:
- Unintended service degradation or downtime
- Corruption of test data
- Triggering of security alerts or automated response systems
- Temporary locking of user accounts during credential testing

### HackDay's Precautions
HackDay Penetration Limited has implemented the following safeguards:
- All exploit code undergoes static analysis review before execution
- Destructive payloads are avoided where non-destructive alternatives exist
- Production data is not modified except where absolutely necessary for PoC, and only with prior approval
- Rollback procedures are documented for all testing activities

### Limitation of Liability
HackDay Penetration Limited shall not be held liable for any damages, losses, or costs arising from testing activities conducted strictly within the scope and rules of engagement defined in this Agreement. This limitation does not apply in cases of gross negligence or willful misconduct.

### Indemnification
The Client agrees to indemnify and hold harmless HackDay Penetration Limited against any claims by third parties arising from authorized testing activities, provided such activities comply with this Agreement.

---

## 7. DELIVERABLES

Upon completion of engagement, HackDay Penetration Limited shall deliver:

| Deliverable | Description | Format |
|-------------|-------------|--------|
| Full Technical Report | Detailed findings, CVSS 3.1 scores, PoC evidence (screenshots, request/response pairs), exploitation steps, and remediation recommendations | PDF |
| Executive Summary | Non-technical overview for C-suite and management stakeholders | PDF |
| Remediation Roadmap | Prioritized action plan with estimated effort levels | PDF / Spreadsheet |
| Raw Scan Data | Complete tool output logs (Nmap, Burp, Nuclei, Nessus, etc.) | Archive (ZIP) |
| Remediation Retest | One complimentary retest cycle to verify fixes (up to 5 days) | Within 30 days of fix deployment |

**Timeline**: Final deliverables shall be submitted within 10 business days of engagement completion.

---

## 8. DURATION & VALIDITY

- **Engagement Start Date**: ___________________ (MM/DD/YYYY)
- **Engagement End Date**: ___________________ (MM/DD/YYYY)

This Authorization is valid only during the period specified above. Any testing conducted outside these dates requires a new or amended Agreement.

### Early Termination
Either party may terminate this Agreement with 48 hours written notice. Deliverables shall be prorated to work completed up to the termination date.

---

## 9. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of the State of California, United States of America, and applicable federal laws pertaining to authorized cybersecurity testing (including the Computer Fraud and Abuse Act exemptions for authorized security research).

---

## 10. SIGNATURES

### CLIENT — SHABIKI.COM

By signing below, the Client confirms they are the lawful owner or duly authorized representative of shabiki.com and its associated assets, and that they have read, understood, and agree to all terms in this Agreement.

**Signed**: _____________________________________________

**Print Name**: _____________________________________________

**Title**: _____________________________________________

**Date**: ___________________ (MM/DD/YYYY)

**Email**: _____________________________________________

**Phone**: _____________________________________________

### PENETRATION TESTING FIRM — HACKDAY PENETRATION LIMITED

By signing below, HackDay Penetration Limited agrees to conduct all testing activities professionally, ethically, and strictly within the scope and rules of engagement defined in this Agreement.

**Signed**: _____________________________________________

**Print Name**: James Kariuki

**Title**: Lead Penetration Tester / Managing Director

**Date**: May 22, 2026

**Email**: engagements@hackdaypenetration.com

**Phone**: +254 722 300 146

**Company**: HackDay Penetration Limited  
10960 Wilshire Blvd, Suite 1415  
Los Angeles, CA 90024  
USA

---

## ANNEX A — EMERGENCY CONTACT & ESCALATION

| Role | Name | Phone | Email |
|------|------|-------|-------|
| HackDay Lead Tester | James Kariuki | +254 722 300 146 | engagements@hackdaypenetration.com |
| HackDay Emergency Hotline | On-Call Engineer | +254 701 892 554 | emergency@hackdaypenetration.com |
| Client Technical POC | [Name] | [Phone] | [Email] |
| Client Emergency Contact | [Name] | [Phone] | [Email] |

---

## END OF AGREEMENT

**Document Status**: ✅ AUTHORIZED FOR TESTING  
**Document Version**: 1.0  
**Date Stored**: May 22, 2026  
**Location**: `/workspaces/Test-my-site/authorization/`

---

## ⚠️ IMPORTANT NOTES

This agreement provides legal authorization for security testing of shabiki.com. Keep this document secure and reference it during all testing activities.

