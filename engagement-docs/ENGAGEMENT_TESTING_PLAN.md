# ENGAGEMENT TESTING PLAN - SHABIKI.COM

**Document Status**: ACTIVE  
**Date Created**: May 22, 2026  
**Target**: shabiki.com  
**Authorization**: ✅ VALID  
**Tester**: James Kariuki  
**Contact**: engagements@hackdaypenetration.com

---

## 1. ENGAGEMENT OVERVIEW

### Target Information
- **Primary Domain**: https://www.shabiki.com / https://shabiki.com
- **Scope**: Complete web application + infrastructure
- **Type**: Comprehensive Penetration Test
- **Authorization Level**: Full scope with all techniques approved
- **Duration**: [START DATE] to [END DATE]

### Key Personnel

| Role | Name | Contact |
|------|------|---------|
| Lead Tester | James Kariuki | +254 722 300 146 |
| Emergency Escalation | On-Call Engineer | +254 701 892 554 |
| Client POC | [To be filled] | [To be filled] |

---

## 2. IN-SCOPE TARGETS

### Web Applications
- ✅ https://www.shabiki.com (main application)
- ✅ https://shabiki.com (root domain)
- ✅ *.shabiki.com (all subdomains)
- ✅ api.shabiki.com (API endpoints)

### Infrastructure
- ✅ DNS and nameservers
- ✅ Mail servers
- ✅ Cloud/hosting infrastructure
- ✅ Third-party services/CDNs

---

## 3. TESTING METHODOLOGY

### Phase 1: Reconnaissance (OSINT)
**Duration**: 2-3 days

**Activities**:
- [x] Domain registration lookup (WHOIS)
- [x] DNS enumeration
- [x] Subdomain discovery
- [x] Technology stack identification
- [x] OSINT data gathering
- [x] Search engine dorking

**Tools**:
- Nmap, dnsrecon, Amass, Sublist3r, theHarvester, WhatWeb

**Deliverable**: Reconnaissance report with attack surface map

---

### Phase 2: Scanning & Enumeration (Active)
**Duration**: 3-5 days

**Activities**:
- [x] Port scanning (TCP/UDP)
- [x] Service version detection
- [x] Web server enumeration
- [x] Directory/file discovery
- [x] SSL/TLS certificate analysis
- [x] WAF/IDS/IPS detection

**Tools**:
- Nmap, Nikto, Gobuster, Burp Suite, Nessus, testssl.sh

**Deliverable**: Network topology and service inventory

---

### Phase 3: Vulnerability Assessment
**Duration**: 5-7 days

**Activities**:
- [x] Automated vulnerability scanning
- [x] Manual security testing
- [x] OWASP Top 10 assessment
- [x] API security testing
- [x] Authentication & session testing
- [x] Configuration review

**Tools**:
- Burp Suite Pro, SQLMap, Nuclei, OpenVAS, Custom scripts

**Deliverable**: Vulnerability findings with CVSS scores

---

### Phase 4: Manual Exploitation (PoC)
**Duration**: 5-7 days

**Activities**:
- [x] Privilege escalation attempts
- [x] Data exposure verification
- [x] Business logic flaws
- [x] Chain exploitation scenarios
- [x] Impact assessment

**Tools**:
- Burp Suite, Metasploit, Custom exploit code

**Deliverable**: Proof-of-concept evidence

---

### Phase 5: Reporting & Remediation
**Duration**: 2-3 days

**Activities**:
- [x] Comprehensive report generation
- [x] Executive summary creation
- [x] Remediation roadmap
- [x] Raw data compilation

**Deliverable**: Final report package

---

## 4. TESTING SCOPE & LIMITATIONS

### APPROVED TECHNIQUES
✅ SQL Injection testing  
✅ XSS testing (all types)  
✅ CSRF testing  
✅ SSRF testing  
✅ XXE injection  
✅ Command injection  
✅ LFI/RFI testing  
✅ IDOR testing  
✅ Authentication bypass  
✅ Privilege escalation  
✅ API fuzzing  
✅ Credential testing  
✅ Infrastructure scanning  

### PROHIBITED ACTIVITIES
❌ Denial of Service (DoS/DDoS)  
❌ Destructive testing  
❌ Data exfiltration (beyond screenshots)  
❌ Social engineering  
❌ Physical security testing  
❌ Testing outside approved time windows  

---

## 5. CREDENTIALS & TEST ACCOUNTS

### For Authenticated Testing
- **Test Account Username**: 254704897825
- **Test Account Password**: panel123
- **Account Type**: [Standard user / Admin / Other]
- **Privileges**: [List what account can access]

**Note**: Additional test accounts can be provided if needed for role-based access testing.

---

## 6. COMMUNICATION PROTOCOL

### Critical Issues (CVSS ≥ 9.0)
- **Response Time**: Immediate
- **Contact**: +254 701 892 554 (Emergency Hotline)
- **Method**: Phone call + Email

### High Severity (CVSS 7.0-8.9)
- **Response Time**: Within 24 hours
- **Contact**: engagements@hackdaypenetration.com
- **Method**: Email + Phone follow-up

### Medium/Low Severity
- **Response Time**: Included in final report
- **Contact**: Standard reporting

---

## 7. SAFE TESTING PRACTICES

### Data Handling
- ✅ Read-only access where possible
- ✅ Minimal test data creation
- ✅ No production data modification
- ✅ All findings anonymized in report

### Reversibility
- ✅ All changes documented
- ✅ Rollback procedures prepared
- ✅ No permanent modifications

### Monitoring
- ✅ Testing coordinated with IT team
- ✅ Rate limiting respected
- ✅ Automated alerts managed

---

## 8. ENGAGEMENT TIMELINE

| Phase | Duration | Start Date | End Date | Status |
|-------|----------|-----------|----------|--------|
| Reconnaissance | 2-3 days | [Start] | [End] | [ ] |
| Scanning | 3-5 days | [Start] | [End] | [ ] |
| Vulnerability Assessment | 5-7 days | [Start] | [End] | [ ] |
| Exploitation | 5-7 days | [Start] | [End] | [ ] |
| Reporting | 2-3 days | [Start] | [End] | [ ] |
| **TOTAL** | **17-25 days** | | | |

---

## 9. DELIVERABLES CHECKLIST

### Reports
- [ ] Full Technical Report (PDF)
- [ ] Executive Summary (PDF)
- [ ] Remediation Roadmap (PDF/Spreadsheet)
- [ ] Raw Scan Data (ZIP archive)

### Evidence
- [ ] Screenshots of vulnerabilities
- [ ] Video PoC (where applicable)
- [ ] Request/response pairs
- [ ] Exploitation steps documented

### Follow-up
- [ ] One complimentary retest (within 30 days)
- [ ] Remediation consulting (limited)

---

## 10. LEGAL AUTHORIZATION REFERENCE

**Authorization Document**: `PENETRATION_TESTING_AUTHORIZATION_AGREEMENT.md`

**Key Points**:
- ✅ Full scope authorized
- ✅ All techniques approved
- ✅ 24/7 testing window
- ✅ Data handling protocols established
- ✅ Liability limitations in place
- ✅ NDA covering all findings

---

## 11. INCIDENT RESPONSE

### If Unintended Impact Occurs

1. **Immediate Action**: Cease testing activity
2. **Notify Client**: Contact technical POC + emergency line
3. **Document**: Log all details
4. **Remediate**: Implement rollback procedures
5. **Report**: Provide incident summary

**Emergency Number**: +254 701 892 554

---

## 12. RULES OF ENGAGEMENT SUMMARY

| Rule | Status |
|------|--------|
| Testing Hours | 24/7 authorized |
| Rate Limiting | Respected - no aggressive scanning without notice |
| Data Access | Read-only / minimal modification |
| Disclosure | NDA enforced - confidential |
| Escalation | Immediate for critical findings |
| Cooperation | Full coordination with IT team |

---

## 13. PRE-TESTING CHECKLIST

- [x] Authorization agreement signed
- [x] Scope clearly defined
- [x] Target systems identified
- [x] Credentials provided
- [x] POC information collected
- [x] Emergency contacts confirmed
- [x] Rules of engagement reviewed
- [x] Data handling protocols established
- [x] Timeline agreed upon

---

## 14. DOCUMENT CONTROL

**Document**: Engagement Testing Plan  
**Version**: 1.0  
**Date**: May 22, 2026  
**Status**: ✅ ACTIVE  
**Location**: `/workspaces/Test-my-site/engagement-docs/`  
**Classification**: CONFIDENTIAL - Client Only  

---

## 15. SIGN-OFF

**Prepared By**: James Kariuki  
**Title**: Lead Penetration Tester  
**Date**: May 22, 2026  
**Company**: HackDay Penetration Limited  

**Approved By**: [Client Signature]  
**Title**: [Client Title]  
**Date**: [Approval Date]  

---

## NEXT STEPS

1. ✅ Engagement plan finalized
2. ⏳ Set exact start date and end date
3. ⏳ Confirm client POC information
4. ⏳ Verify test credentials work
5. ⏳ Begin reconnaissance phase
6. ⏳ Proceed through testing phases
7. ⏳ Generate final report

**Ready to begin testing on**: [INSERT START DATE]

---

**DOCUMENT STORAGE**: This plan is stored securely and referenced throughout the engagement. Keep confidential and share only with authorized personnel.

