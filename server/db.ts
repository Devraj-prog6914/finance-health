import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeMSMEScore } from './scoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

// Interface Definitions
export interface MSME {
  id: string;
  name: string;
  PAN: string;
  GSTIN: string;
  sector: 'Retail' | 'Manufacturing' | 'Services' | 'Logistics' | 'Food';
  region: 'North' | 'South' | 'East' | 'West' | 'Central';
  vintage_years: number;
  employee_count: number;
}

export interface DataSourceRecord {
  msme_id: string;
  source_type: 'GST' | 'UPI' | 'AA' | 'EPFO';
  raw_metrics: {
    monthly_data: Array<{
      month: string;
      value: number;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  last_synced: string;
}

export interface HealthScore {
  id: string;
  msme_id: string;
  composite_score: number;
  grade: string;
  risk_band: 'Low' | 'Medium' | 'High';
  dimension_scores: {
    revenue_stability: number;
    cash_flow_health: number;
    compliance_formalization: number;
    business_stability: number;
    repayment_capacity: number;
  };
  computed_at: string;
}

export interface ScoreExplanation {
  score_id: string;
  confidence: number; // e.g. 95%
  strengths: string[];
  risks: string[];
  positive_contributors: Array<{ name: string; impact: number; explanation: string }>;
  negative_contributors: Array<{ name: string; impact: number; explanation: string }>;
  recommendations: Array<{ action: string; expected_impact: number; timeline: string }>;
}

export interface CreditRecommendation {
  msme_id: string;
  product_type: string;
  suggested_amount: number; // in INR Lakhs
  suggested_rate_band: string;
  status: 'Eligible' | 'Borderline' | 'Ineligible';
}

export interface RMAction {
  msme_id: string;
  decision: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  notes: string;
  timestamp: string;
}

// Full DB State Interface
export interface DatabaseState {
  msmes: MSME[];
  data_sources: DataSourceRecord[];
  scores: HealthScore[];
  explanations: ScoreExplanation[];
  recommendations: CreditRecommendation[];
  rm_actions: RMAction[];
}

let memoryDbState: DatabaseState | null = null;

export const getDatabase = (): DatabaseState => {
  if (memoryDbState) {
    return memoryDbState;
  }

  let state: DatabaseState;
  if (!fs.existsSync(DB_FILE)) {
    console.log("[db.ts] db.json not found, seeding in-memory...");
    state = seedDatabase();
  } else {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      state = JSON.parse(raw);
    } catch (err) {
      console.error("[db.ts] Error reading database, seeding in-memory: ", err);
      state = seedDatabase();
    }
  }

  // Calculate scores and recommendations if empty
  if (state.scores.length === 0 && state.msmes.length > 0) {
    state.msmes.forEach(msme => {
      const records = state.data_sources.filter(r => r.msme_id === msme.id);
      const { score, explanation, recommendation } = computeMSMEScore(msme, records);
      state.scores.push(score);
      state.explanations.push(explanation);
      state.recommendations.push(recommendation);
    });
  }

  memoryDbState = state;
  return memoryDbState;
};

export const saveDatabase = (state: DatabaseState) => {
  memoryDbState = state;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.warn("[db.ts] Warning: filesystem is read-only. Database changes stored in memory only:", err);
  }
};

// Seed Logic: 25-30 Indian MSMEs with realistic patterns
function seedDatabase(): DatabaseState {
  const msmes: MSME[] = [];
  const data_sources: DataSourceRecord[] = [];
  const scores: HealthScore[] = [];
  const explanations: ScoreExplanation[] = [];
  const recommendations: CreditRecommendation[] = [];
  const rm_actions: RMAction[] = [];

  const sectors = ['Retail', 'Manufacturing', 'Services', 'Logistics', 'Food'] as const;
  const regions = ['North', 'South', 'East', 'West', 'Central'] as const;

  // Let's create specific names matching typical Indian MSMEs
  const rawMSMEnames = [
    { name: "Vardhaman Textiles & Garments", sector: "Manufacturing" as const },
    { name: "Kalyan Grocery & Provision Stores", sector: "Retail" as const },
    { name: "Apex Logistics & Packers", sector: "Logistics" as const },
    { name: "Balaji Food Services & catering", sector: "Food" as const },
    { name: "Technova Software Solutions", sector: "Services" as const },
    { name: "Krishna Agro Industries", sector: "Manufacturing" as const },
    { name: "Ganesh Sweets & Namkeen", sector: "Food" as const },
    { name: "Sai Ram Electronic Retailers", sector: "Retail" as const },
    { name: "Express Cargo Movers", sector: "Logistics" as const },
    { name: "Devi Consultancies & HR Services", sector: "Services" as const },
    { name: "Shree Metal Forgings", sector: "Manufacturing" as const },
    { name: "Mahalaxmi Textiles & Sarees", sector: "Retail" as const },
    { name: "Royal Caterers & Banquets", sector: "Food" as const },
    { name: "Vikas Transport Service", sector: "Logistics" as const },
    { name: "Global Design Studio & Ads", sector: "Services" as const },
    { name: "Om Enterprise & Packaging", sector: "Manufacturing" as const },
    { name: "Aditya Supermarket", sector: "Retail" as const },
    { name: "Satyam Bakers & Confectioners", sector: "Food" as const },
    { name: "Hindustan Warehousing & Cold Chain", sector: "Logistics" as const },
    { name: "Natarajan & Sons Financial Services", sector: "Services" as const },
    { name: "Ambika Plastic Industries", sector: "Manufacturing" as const },
    { name: "Raja Footwear Depot", sector: "Retail" as const },
    { name: "Flavors of Punjab Restaurant", sector: "Food" as const },
    { name: "Speedex Logistics solutions", sector: "Logistics" as const },
    { name: "Pixelate Digital Marketing agency", sector: "Services" as const },
    { name: "Chamundi Engineering Works", sector: "Manufacturing" as const },
    { name: "Vijay Stationery & Book Distributors", sector: "Retail" as const },
  ];

  // Helper for generating simulated months (last 12 months)
  const getMonths = () => {
    const months = [];
    const date = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
    }
    return months;
  };
  const months = getMonths();

  rawMSMEnames.forEach((item, index) => {
    const id = `msme-${1000 + index}`;
    const stateShort = regions[index % regions.length];
    
    // Generate valid looking PAN and GSTIN
    const panNum = Math.floor(1000 + Math.random() * 9000);
    const PAN = `AAApC${panNum}G`;
    const gstStateCode = (index % 35 + 1).toString().padStart(2, '0');
    const GSTIN = `${gstStateCode}${PAN}1Z${index % 9}`;

    const vintage_years = 2 + (index % 15) + (index % 3 === 0 ? 1 : 0);
    const employee_count = 5 + (index % 5) * 6 + (item.sector === 'Manufacturing' ? 20 : 2);

    msmes.push({
      id,
      name: item.name,
      PAN,
      GSTIN,
      sector: item.sector,
      region: stateShort,
      vintage_years,
      employee_count,
    });

    // Create realistic profile variations (excellent, average, volatile/poor compliance, high-risk)
    let profileType: 'excellent' | 'average' | 'volatile' | 'high_risk' = 'average';
    if (index % 6 === 0) profileType = 'excellent';
    else if (index % 6 === 3) profileType = 'volatile';
    else if (index % 6 === 5) profileType = 'high_risk';

    // 1. GST Source
    // Base turnover: Retail/Food (10-30L/mo), Manufacturing/Logistics (30-80L/mo), Services (5-15L/mo)
    let baseTurnover = 20; // in Lakhs
    if (item.sector === 'Manufacturing') baseTurnover = 55;
    else if (item.sector === 'Logistics') baseTurnover = 35;
    else if (item.sector === 'Services') baseTurnover = 12;

    const gstMonthly = months.map((month, mIdx) => {
      let noise = Math.sin(mIdx / 1.5) * 0.15; // cyclicality
      // Seasonal effects (e.g. Diwali in Oct-Nov, monsoon dip in Jul-Aug)
      if (month.startsWith('Oct') || month.startsWith('Nov')) {
        noise += (item.sector === 'Retail' || item.sector === 'Food') ? 0.35 : 0.1;
      }
      if (month.startsWith('Jul') || month.startsWith('Aug')) {
        noise -= (item.sector === 'Logistics' || item.sector === 'Manufacturing') ? 0.25 : 0.05;
      }

      if (profileType === 'volatile') {
        noise += (Math.random() - 0.5) * 0.45; // high noise
      } else if (profileType === 'high_risk') {
        noise -= (mIdx / 12) * 0.4; // steady decline
      } else if (profileType === 'excellent') {
        noise += (mIdx / 12) * 0.15; // steady growth, low volatility
      }

      const value = Math.max(1.5, parseFloat((baseTurnover * (1 + noise)).toFixed(2)));
      
      // Compliance: filing delay
      let fileDelayDays = Math.floor(Math.random() * 5); // normally on time
      if (profileType === 'volatile') {
        fileDelayDays = Math.random() > 0.4 ? Math.floor(Math.random() * 15) : 0;
      } else if (profileType === 'high_risk') {
        fileDelayDays = Math.random() > 0.2 ? Math.floor(10 + Math.random() * 20) : 5;
      }

      return {
        month,
        value,
        filed_delay_days: fileDelayDays,
      };
    });

    data_sources.push({
      msme_id: id,
      source_type: 'GST',
      raw_metrics: {
        monthly_data: gstMonthly,
        registration_status: "Active",
        filing_regularity_pct: profileType === 'excellent' ? 100 : profileType === 'average' ? 92 : profileType === 'volatile' ? 75 : 58,
      },
      last_synced: new Date().toISOString().split('T')[0],
    });

    // 2. UPI Source
    // High-frequency low-ticket for Food/Retail. Low-frequency high-ticket for Services/Mfg.
    const upiMonthly = months.map((month, mIdx) => {
      const gstVal = gstMonthly[mIdx].value;
      // UPI captures a percentage of GST turnover
      let upiShare = 0.65; // Retail and food accept mostly UPI
      if (item.sector === 'Services') upiShare = 0.4;
      if (item.sector === 'Manufacturing') upiShare = 0.2;

      let upiVolume = gstVal * upiShare;
      let txnCount = item.sector === 'Retail' || item.sector === 'Food' ? Math.floor(1000 + Math.random() * 2000) : Math.floor(50 + Math.random() * 100);
      
      if (profileType === 'high_risk') {
        upiVolume *= 0.8;
      }

      return {
        month,
        value: parseFloat(upiVolume.toFixed(2)),
        transaction_count: txnCount,
        average_ticket_size: parseFloat((upiVolume * 100000 / txnCount).toFixed(2)), // in INR
      };
    });

    data_sources.push({
      msme_id: id,
      source_type: 'UPI',
      raw_metrics: {
        monthly_data: upiMonthly,
        active_qr_count: item.sector === 'Retail' || item.sector === 'Food' ? 4 : 1,
        inflow_consistency_score: profileType === 'excellent' ? 95 : profileType === 'average' ? 82 : profileType === 'volatile' ? 60 : 40,
      },
      last_synced: new Date().toISOString().split('T')[0],
    });

    // 3. Account Aggregator (AA) - Bank Statements
    const aaMonthly = months.map((month, mIdx) => {
      const gstVal = gstMonthly[mIdx].value;
      // Inflow matches GST turnover roughly (excluding UPI cash components + other channels)
      const inflow = gstVal * (1.1 + (Math.random() - 0.5) * 0.1);
      
      // Outflows: Expenses, salaries, rent
      let outflowRatio = 0.88; // average profitable business
      if (profileType === 'excellent') outflowRatio = 0.82;
      else if (profileType === 'volatile') outflowRatio = 0.93;
      else if (profileType === 'high_risk') outflowRatio = 1.05; // spending more than earning (drain)

      const outflow = inflow * outflowRatio;
      const netCash = inflow - outflow;
      
      // Average Balance
      let avgBal = inflow * 0.15; // 15% of turnover as buffer
      if (profileType === 'excellent') avgBal = inflow * 0.3;
      else if (profileType === 'high_risk') avgBal = Math.max(0.1, inflow * 0.02);

      // ECS/Cheque Bounces
      let bounceCount = 0;
      if (profileType === 'volatile' && Math.random() > 0.6) bounceCount = Math.floor(1 + Math.random() * 2);
      if (profileType === 'high_risk') bounceCount = Math.floor(2 + Math.random() * 3);

      return {
        month,
        value: parseFloat(avgBal.toFixed(2)), // store avg balance as the base value
        inflow: parseFloat(inflow.toFixed(2)),
        outflow: parseFloat(outflow.toFixed(2)),
        bounce_count: bounceCount,
        overdraft_utilization_pct: profileType === 'excellent' ? 5 : profileType === 'average' ? 35 : profileType === 'volatile' ? 70 : 92,
      };
    });

    data_sources.push({
      msme_id: id,
      source_type: 'AA',
      raw_metrics: {
        monthly_data: aaMonthly,
        bank_accounts_connected: 2,
        overdraft_limit_lakhs: item.sector === 'Manufacturing' ? 25 : 5,
        emi_obligations_lakhs: profileType === 'high_risk' ? 4.5 : 1.2,
      },
      last_synced: new Date().toISOString().split('T')[0],
    });

    // 4. EPFO (Employment Payroll Data)
    const epfoMonthly = months.map((month, mIdx) => {
      let empCount = employee_count;
      // Growth trend
      if (profileType === 'excellent') {
        empCount = employee_count + Math.floor(mIdx / 4);
      } else if (profileType === 'high_risk') {
        empCount = Math.max(1, employee_count - Math.floor(mIdx / 3));
      }

      let compliantFiling = true;
      if (profileType === 'volatile' && mIdx % 4 === 0) compliantFiling = false;
      if (profileType === 'high_risk' && mIdx > 6) compliantFiling = false;

      return {
        month,
        value: empCount, // employees
        is_filed_on_time: compliantFiling,
      };
    });

    data_sources.push({
      msme_id: id,
      source_type: 'EPFO',
      raw_metrics: {
        monthly_data: epfoMonthly,
        registration_date: `${2026 - vintage_years}-05-12`,
        payroll_consistency_pct: profileType === 'excellent' ? 100 : profileType === 'average' ? 95 : profileType === 'volatile' ? 80 : 50,
      },
      last_synced: new Date().toISOString().split('T')[0],
    });

    // Pre-seed RM Actions
    let decision: RMAction['decision'] = 'Pending';
    let notes = '';
    if (profileType === 'excellent') {
      decision = 'Approved';
      notes = 'Exceptional cash flow stability, perfect GST filing regularity, and growing workforce. Recommended for immediate approval.';
    } else if (profileType === 'high_risk') {
      decision = 'Rejected';
      notes = 'Declining revenues, multiple bank bounces in the last 90 days, and high overdraft utilization. High credit risk.';
    } else if (index % 3 === 1) {
      decision = 'Under Review';
      notes = 'GST and UPI data show robust volumes. Reviewing overdraft usage and minor recent EPFO delays.';
    }

    rm_actions.push({
      msme_id: id,
      decision,
      notes,
      timestamp: new Date(Date.now() - (index % 5) * 86400000).toISOString(),
    });
  });

  return {
    msmes,
    data_sources,
    scores,
    explanations,
    recommendations,
    rm_actions,
  };
}
