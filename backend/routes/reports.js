const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '../../reports');

// Create reports directory if it doesn't exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * POST /api/reports/create
 * Create a test report
 */
router.post('/create', (req, res) => {
  try {
    const { testName, domain, results, tools, findings } = req.body;

    if (!testName || !domain) {
      return res.status(400).json({ error: 'Test name and domain are required' });
    }

    const report = {
      id: Math.random().toString(36).substr(2, 9),
      testName,
      domain,
      results,
      tools,
      findings,
      createdAt: new Date(),
      severity: calculateSeverity(findings)
    };

    const fileName = `${testName}-${Date.now()}.json`;
    const filePath = path.join(REPORTS_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

    res.json({
      success: true,
      reportId: report.id,
      fileName,
      message: 'Report created successfully'
    });
  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({ error: 'Failed to create report', details: error.message });
  }
});

/**
 * GET /api/reports/list
 * List all reports
 */
router.get('/list', (req, res) => {
  try {
    const files = fs.readdirSync(REPORTS_DIR);
    const reports = files.map(file => {
      const filePath = path.join(REPORTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    });

    res.json(reports);
  } catch (error) {
    console.error('Report list error:', error);
    res.status(500).json({ error: 'Failed to list reports', details: error.message });
  }
});

/**
 * GET /api/reports/:reportId
 * Get a specific report
 */
router.get('/:reportId', (req, res) => {
  try {
    const files = fs.readdirSync(REPORTS_DIR);
    
    for (const file of files) {
      const filePath = path.join(REPORTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const report = JSON.parse(content);
      
      if (report.id === req.params.reportId) {
        return res.json(report);
      }
    }

    res.status(404).json({ error: 'Report not found' });
  } catch (error) {
    console.error('Report fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch report', details: error.message });
  }
});

/**
 * DELETE /api/reports/:reportId
 * Delete a report
 */
router.delete('/:reportId', (req, res) => {
  try {
    const files = fs.readdirSync(REPORTS_DIR);
    
    for (const file of files) {
      const filePath = path.join(REPORTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const report = JSON.parse(content);
      
      if (report.id === req.params.reportId) {
        fs.unlinkSync(filePath);
        return res.json({ success: true, message: 'Report deleted' });
      }
    }

    res.status(404).json({ error: 'Report not found' });
  } catch (error) {
    console.error('Report deletion error:', error);
    res.status(500).json({ error: 'Failed to delete report', details: error.message });
  }
});

/**
 * Helper function to calculate severity
 */
function calculateSeverity(findings) {
  if (!findings || findings.length === 0) return 'low';
  
  const hasCritical = findings.some(f => f.severity === 'critical');
  const hasHigh = findings.some(f => f.severity === 'high');
  
  if (hasCritical) return 'critical';
  if (hasHigh) return 'high';
  return 'medium';
}

module.exports = router;
