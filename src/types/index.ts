export interface MSME {
  id: string;
  name: string;
  PAN: string;
  GSTIN: string;
  sector: 'Retail' | 'Manufacturing' | 'Services' | 'Logistics' | 'Food';
  region: 'North' | 'South' | 'East' | 'West' | 'Central';
  vintage_years: number;
  employee_count: number;
  score?: HealthScore;
  recommendation?: CreditRecommendation;
  rmAction?: RMAction;
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
  confidence: number;
  strengths: string[];
  risks: string[];
  positive_contributors: Array<{ name: string; impact: number; explanation: string }>;
  negative_contributors: Array<{ name: string; impact: number; explanation: string }>;
  recommendations: Array<{ action: string; expected_impact: number; timeline: string }>;
}

export interface CreditRecommendation {
  msme_id: string;
  product_type: string;
  suggested_amount: number;
  suggested_rate_band: string;
  status: 'Eligible' | 'Borderline' | 'Ineligible';
}

export interface RMAction {
  msme_id: string;
  decision: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  notes: string;
  timestamp: string;
}

export interface FullMSMEDetails {
  msme: MSME;
  records: DataSourceRecord[];
  score: HealthScore | null;
  explanation: ScoreExplanation | null;
  recommendation: CreditRecommendation | null;
  rmAction: RMAction;
}
