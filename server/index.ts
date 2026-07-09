import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDatabase, saveDatabase, MSME, DataSourceRecord, HealthScore, RMAction } from './db.js';
import { computeMSMEScore } from './scoring.js';
import { handleCopilotChat } from './copilot.js';
import { generateHtmlReport } from './pdf.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5500;

app.use(cors());
app.use(express.json());

// Simple Mock JWT Auth middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // For hackathon simplicity, we verify if a token is present.
  // If not, we allow viewing as "RM" by default or return a 401.
  // Let's implement JWT role-based inspection mock:
  if (!token) {
    // Return a mock guest state or proceed
    (req as any).user = { role: 'RM', name: 'Dev Bank Officer' };
    return next();
  }

  try {
    // Decoding mock token payload (e.g. role-name-timestamp)
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [role, name] = decoded.split(':');
    (req as any).user = { role, name };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token structure" });
  }
};

// ----------------------------------------------------
// Authentication Routes
// ----------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { username, role } = req.body;
  if (!role) {
    return res.status(400).json({ error: "Role is required" });
  }
  // Generate a simple mock JWT (base64 encoded role:username)
  const tokenPayload = `${role}:${username || 'User'}`;
  const token = Buffer.from(tokenPayload).toString('base64');
  res.json({
    token,
    role,
    name: username || 'User',
  });
});

// ----------------------------------------------------
// MSME APIs
// ----------------------------------------------------

// Get all MSMEs
app.get('/api/msmes', authenticateToken, (req, res) => {
  const db = getDatabase();
  const result = db.msmes.map(m => {
    const score = db.scores.find(s => s.msme_id === m.id);
    const recommendation = db.recommendations.find(r => r.msme_id === m.id);
    const rmAction = db.rm_actions.find(a => a.msme_id === m.id);
    return {
      ...m,
      score: score || null,
      recommendation: recommendation || null,
      rmAction: rmAction || { msme_id: m.id, decision: 'Pending', notes: '', timestamp: '' },
    };
  });
  res.json(result);
});

// Get single MSME details
app.get('/api/msmes/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  const msme = db.msmes.find(m => m.id === id);
  if (!msme) {
    return res.status(404).json({ error: "MSME not found" });
  }

  const records = db.data_sources.filter(r => r.msme_id === id);
  const score = db.scores.find(s => s.msme_id === id);
  const explanation = db.explanations.find(e => e.score_id === score?.id);
  const recommendation = db.recommendations.find(r => r.msme_id === id);
  const rmAction = db.rm_actions.find(a => a.msme_id === id);

  res.json({
    msme,
    records,
    score: score || null,
    explanation: explanation || null,
    recommendation: recommendation || null,
    rmAction: rmAction || { msme_id: id, decision: 'Pending', notes: '', timestamp: '' },
  });
});

// Recalculate score / trigger Sync
app.post('/api/msmes/:id/sync', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  const msme = db.msmes.find(m => m.id === id);
  if (!msme) {
    return res.status(404).json({ error: "MSME not found" });
  }

  const records = db.data_sources.filter(r => r.msme_id === id);
  const { score, explanation, recommendation } = computeMSMEScore(msme, records);

  // Update in database lists
  db.scores = db.scores.filter(s => s.msme_id !== id);
  db.scores.push(score);

  db.explanations = db.explanations.filter(e => e.score_id !== score.id);
  db.explanations.push(explanation);

  db.recommendations = db.recommendations.filter(r => r.msme_id !== id);
  db.recommendations.push(recommendation);

  saveDatabase(db);
  res.json({ score, explanation, recommendation });
});

// Update RM Action Decision
app.post('/api/msmes/:id/rm-action', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { decision, notes } = req.body;
  if (!decision) {
    return res.status(400).json({ error: "Decision is required" });
  }

  const db = getDatabase();
  const msme = db.msmes.find(m => m.id === id);
  if (!msme) {
    return res.status(404).json({ error: "MSME not found" });
  }

  const existingActionIdx = db.rm_actions.findIndex(a => a.msme_id === id);
  const actionObj: RMAction = {
    msme_id: id,
    decision,
    notes: notes || '',
    timestamp: new Date().toISOString(),
  };

  if (existingActionIdx >= 0) {
    db.rm_actions[existingActionIdx] = actionObj;
  } else {
    db.rm_actions.push(actionObj);
  }

  saveDatabase(db);
  res.json(actionObj);
});

// Onboard new MSME
app.post('/api/onboard', authenticateToken, (req, res) => {
  const { name, PAN, GSTIN, sector, region, vintage_years, employee_count, compliance_level } = req.body;

  if (!name || !PAN || !GSTIN || !sector || !region) {
    return res.status(400).json({ error: "Missing required onboarding fields" });
  }

  const db = getDatabase();
  const id = `msme-${1000 + db.msmes.length}`;

  const newMsme: MSME = {
    id,
    name,
    PAN,
    GSTIN,
    sector,
    region,
    vintage_years: Number(vintage_years || 3),
    employee_count: Number(employee_count || 10),
  };

  // Generate realistic GST, UPI, AA, EPFO datasets for this new member
  const months = [];
  const date = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    months.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
  }

  let baseTurnover = sector === 'Manufacturing' ? 50 : sector === 'Services' ? 10 : 20;
  let complianceMultiplier = compliance_level === 'excellent' ? 1.0 : compliance_level === 'volatile' ? 0.8 : 0.65;

  // 1. GST Record
  const gstMonthly = months.map((month, mIdx) => {
    let value = baseTurnover * (1 + Math.sin(mIdx / 2) * 0.15);
    let delay = compliance_level === 'excellent' ? 1 : compliance_level === 'volatile' ? Math.floor(Math.random() * 10) : Math.floor(8 + Math.random() * 15);
    return { month, value: parseFloat(value.toFixed(2)), filed_delay_days: delay };
  });

  const gstRecord: DataSourceRecord = {
    msme_id: id,
    source_type: 'GST',
    raw_metrics: {
      monthly_data: gstMonthly,
      registration_status: "Active",
      filing_regularity_pct: compliance_level === 'excellent' ? 100 : compliance_level === 'volatile' ? 83 : 66,
    },
    last_synced: new Date().toISOString().split('T')[0],
  };

  // 2. UPI Record
  const upiMonthly = months.map((month, mIdx) => {
    let val = gstMonthly[mIdx].value * 0.5;
    return {
      month,
      value: parseFloat(val.toFixed(2)),
      transaction_count: Math.floor(200 + Math.random() * 500),
      average_ticket_size: 1500,
    };
  });
  const upiRecord: DataSourceRecord = {
    msme_id: id,
    source_type: 'UPI',
    raw_metrics: {
      monthly_data: upiMonthly,
      active_qr_count: 2,
      inflow_consistency_score: compliance_level === 'excellent' ? 92 : compliance_level === 'volatile' ? 70 : 50,
    },
    last_synced: new Date().toISOString().split('T')[0],
  };

  // 3. AA Record
  const aaMonthly = months.map((month, mIdx) => {
    const inflow = gstMonthly[mIdx].value * 1.05;
    const outflowRatio = compliance_level === 'excellent' ? 0.84 : compliance_level === 'volatile' ? 0.92 : 1.02;
    const outflow = inflow * outflowRatio;
    const avgBal = inflow * (compliance_level === 'excellent' ? 0.25 : 0.05);
    const bounces = compliance_level === 'excellent' ? 0 : compliance_level === 'volatile' ? 1 : Math.floor(1 + Math.random() * 3);
    
    return {
      month,
      value: parseFloat(avgBal.toFixed(2)),
      inflow: parseFloat(inflow.toFixed(2)),
      outflow: parseFloat(outflow.toFixed(2)),
      bounce_count: bounces,
      overdraft_utilization_pct: compliance_level === 'excellent' ? 20 : 75,
    };
  });
  const aaRecord: DataSourceRecord = {
    msme_id: id,
    source_type: 'AA',
    raw_metrics: {
      monthly_data: aaMonthly,
      bank_accounts_connected: 1,
      overdraft_limit_lakhs: sector === 'Manufacturing' ? 15 : 5,
      emi_obligations_lakhs: compliance_level === 'poor' ? 3.5 : 1.0,
    },
    last_synced: new Date().toISOString().split('T')[0],
  };

  // 4. EPFO Record
  const epfoMonthly = months.map(month => ({
    month,
    value: newMsme.employee_count,
    is_filed_on_time: compliance_level === 'excellent',
  }));
  const epfoRecord: DataSourceRecord = {
    msme_id: id,
    source_type: 'EPFO',
    raw_metrics: {
      monthly_data: epfoMonthly,
      registration_date: new Date().toISOString().split('T')[0],
      payroll_consistency_pct: compliance_level === 'excellent' ? 100 : 75,
    },
    last_synced: new Date().toISOString().split('T')[0],
  };

  // Add to DB
  db.msmes.push(newMsme);
  db.data_sources.push(gstRecord, upiRecord, aaRecord, epfoRecord);

  // Compute immediate score
  const { score, explanation, recommendation } = computeMSMEScore(newMsme, [gstRecord, upiRecord, aaRecord, epfoRecord]);
  db.scores.push(score);
  db.explanations.push(explanation);
  db.recommendations.push(recommendation);

  // Setup Pending RM Action
  db.rm_actions.push({
    msme_id: id,
    decision: 'Pending',
    notes: 'New MSME applicant auto-onboarded via GSTN/UPI/AA simulator sync.',
    timestamp: new Date().toISOString(),
  });

  saveDatabase(db);
  res.json({
    msme: newMsme,
    score,
    explanation,
    recommendation,
  });
});

// Gemini Copilot API Endpoint
app.post('/api/msmes/:id/copilot', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { message, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const db = getDatabase();
  const msme = db.msmes.find(m => m.id === id);
  if (!msme) {
    return res.status(404).json({ error: "MSME not found" });
  }

  const records = db.data_sources.filter(r => r.msme_id === id);
  const score = db.scores.find(s => s.msme_id === id);
  const explanation = db.explanations.find(e => e.score_id === score?.id);
  const recommendation = db.recommendations.find(r => r.msme_id === id);

  try {
    const reply = await handleCopilotChat(
      message,
      chatHistory || [],
      { msme, records, score, explanation, recommendation }
    );
    res.json({ reply });
  } catch (err: any) {
    console.error("Gemini Copilot Error: ", err);
    res.status(500).json({ error: err.message || "Failed to communicate with AI Copilot" });
  }
});

// Executive Report API (HTML print version)
app.get('/api/msmes/:id/report', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  const msme = db.msmes.find(m => m.id === id);
  if (!msme) {
    return res.status(404).send("<h1>MSME Not Found</h1>");
  }

  const records = db.data_sources.filter(r => r.msme_id === id);
  const score = db.scores.find(s => s.msme_id === id);
  const explanation = db.explanations.find(e => e.score_id === score?.id);
  const recommendation = db.recommendations.find(r => r.msme_id === id);

  if (!score || !explanation || !recommendation) {
    return res.status(400).send("<h1>Scores not calculated yet</h1>");
  }

  const uliParam = req.query.uli === 'true';
  const html = generateHtmlReport(msme, records, score, explanation, recommendation, uliParam);
  res.send(html);
});

// Start Server
app.listen(PORT, () => {
  console.log(`[CreditPulse Server] running on http://localhost:${PORT}`);
});
