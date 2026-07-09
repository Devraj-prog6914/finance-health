import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface MSMEContext {
  msme: any;
  records: any[];
  score: any;
  explanation: any;
  recommendation: any;
}

export async function handleCopilotChat(
  message: string,
  chatHistory: ChatMessage[],
  context: MSMEContext
): Promise<string> {
  const { msme, records, score, explanation, recommendation } = context;

  const apiKey = process.env.GEMINI_API_KEY;

  // Generate context summary for the prompt
  const gstRecord = records.find(r => r.source_type === 'GST');
  const aaRecord = records.find(r => r.source_type === 'AA');
  
  const recentGstValues = gstRecord?.raw_metrics?.monthly_data?.slice(-6).map((d: any) => `${d.month}: ${d.value}L`).join(', ') || 'N/A';
  const compliancePct = gstRecord?.raw_metrics?.filing_regularity_pct || 'N/A';
  const averageBalance = aaRecord?.raw_metrics?.monthly_data?.slice(-6).map((d: any) => `${d.month}: ${d.value}L`).join(', ') || 'N/A';
  const totalBounces = aaRecord?.raw_metrics?.monthly_data?.reduce((sum: number, d: any) => sum + (d.bounce_count || 0), 0) || 0;
  const overdraftUtilization = aaRecord?.raw_metrics?.monthly_data?.[11]?.overdraft_utilization_pct || 0;

  const promptContext = `
You are the "CreditPulse AI CFO" – a highly sophisticated virtual Chief Financial Officer and credit analyst. You are chatting with a bank Relationship Manager or an MSME business owner about the credit file of the following MSME:

MSME Profile:
- Name: ${msme.name}
- Sector: ${msme.sector}
- Region: ${msme.region}
- Operational Vintage: ${msme.vintage_years} years
- Employee Count: ${msme.employee_count}

Credit Card Performance:
- Composite Credit Score: ${score.composite_score}/100
- Credit Grade: ${score.grade}
- Risk Level: ${score.risk_band}

Dimension Scores:
- Revenue Stability: ${score.dimension_scores.revenue_stability}/100
- Cash Flow Health: ${score.dimension_scores.cash_flow_health}/100
- Compliance & Formalization: ${score.dimension_scores.compliance_formalization}/100
- Business Stability: ${score.dimension_scores.business_stability}/100
- Repayment Capacity: ${score.dimension_scores.repayment_capacity}/100

Financial Alternate Signals (last 6 months):
- GST Turnovers: ${recentGstValues}
- GST Filing Regularity: ${compliancePct}%
- Average Bank Balance: ${averageBalance}
- Bank Cheque Bounces (12 mo): ${totalBounces}
- Overdraft Limit Utilization (Recent): ${overdraftUtilization}%

Loan Readiness:
- Status: ${recommendation.status} (Product: ${recommendation.product_type})
- Pre-approved Amount: INR ${recommendation.suggested_amount} Lakhs
- Interest Rate Band: ${recommendation.suggested_rate_band}

Core Strengths:
${explanation.strengths.map((s: string) => `- ${s}`).join('\n')}

Core Risks:
${explanation.risks.map((r: string) => `- ${r}`).join('\n')}

Actionable Improvements Suggested:
${explanation.recommendations.map((r: any) => `- ${r.action} (Expected score impact: +${r.expected_impact} points, timeline: ${r.timeline})`).join('\n')}

INSTRUCTIONS:
1. Speak with professional, financial authority. Use real terms like "DSCR", "debt serviceability", "revenue cyclicality", "overdraft drag", "compliance drag".
2. Never give generic AI disclaimers (e.g. "I am an AI, please check with a professional"). Act as a premium banking system's native intelligence.
3. Keep answers concise, direct, and structured (use markdown bullet points, bolding).
4. Recommend concrete government schemes (Mudra, CGTMSE, Stand-Up India, PSB Loans in 59 Minutes) if applicable. For example, if they need an unsecured loan, suggest CGTMSE.
5. If the user asks about improving their score, refer to the point-quantified recommendations above.
`;

  if (!apiKey) {
    // Return high-quality, simulated AI CFO responses when API key is missing
    console.log("[CreditPulse Server] No GEMINI_API_KEY found. Generating simulated response.");
    return generateSimulatedCfoResponse(message, context, totalBounces, compliancePct, overdraftUtilization);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Format chat history for Gemini
    const contents = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Add system instruction as prefix or system instruction parameter
    // We add it as a system prompt to the content list
    contents.unshift({
      role: 'user',
      parts: [{ text: `SYSTEM INSTRUCTION: ${promptContext}` }]
    });
    
    // Add the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const result = await model.generateContent({ contents: contents as any });
    const response = await result.response;
    return response.text();
  } catch (err: any) {
    console.error("Gemini call failed: ", err);
    return `[System Connection Error: Using Local CFO Engine]
${generateSimulatedCfoResponse(message, context, totalBounces, compliancePct, overdraftUtilization)}`;
  }
}

// Highly realistic mock CFO response generator
function generateSimulatedCfoResponse(
  message: string,
  context: MSMEContext,
  totalBounces: number,
  compliancePct: number,
  overdraftUtilization: number
): string {
  const { msme, score, recommendation, explanation } = context;
  const msgLower = message.toLowerCase();

  if (msgLower.includes('improve') || msgLower.includes('score') || msgLower.includes('increase')) {
    const recs = explanation.recommendations.map((r: any) => `* **${r.action}** (Score Impact: **+${r.expected_impact} pts**, Timeline: ${r.timeline})`).join('\n');
    return `### Actionable Score Improvement Plan for **${msme.name}**

Based on our scoring weights, here are the targeted actions to improve the current score of **${score.composite_score}/100** (Grade: **${score.grade}**):

${recs}

**Financial CFO Context:** 
The fastest path to lifting the score is improving the **Compliance** and **Cash Flow Health** dimensions. Automating GSTR-3B filing and keeping overdraft utilization under 50% will reduce the volatility penalty in our scoring matrix.`;
  }

  if (msgLower.includes('loan') || msgLower.includes('eligibility') || msgLower.includes('limit') || msgLower.includes('borrow')) {
    if (score.composite_score < 60) {
      return `### Credit Eligibility Assessment for **${msme.name}**

* **Status:** Ineligible (Score: **${score.composite_score}**)
* **Primary Constraints:** High credit volatility, multiple cheque bounces (${totalBounces} in 12 months), and severe overdraft utilization of **${overdraftUtilization}%**.
* **CFO Recommendation:** The borrower must establish a clean 90-day banking period with zero balances bounces and clear old trade liabilities. We cannot recommend credit lines under the current risk profile.`;
    }

    return `### Pre-Approved Credit Facilities for **${msme.name}**

* **Pre-approved Product:** **${recommendation.product_type}**
* **Assessed Limit:** **INR ${recommendation.suggested_amount} Lakhs**
* **Pricing Band:** **${recommendation.suggested_rate_band}** (linked to repo rate)
* **Underwriting Summary:** Backed by a strong **${score.risk_band} Risk** profile. Revenue stability is healthy with a filing frequency of **${compliancePct}%**.

**Strategic Recommendations:**
1. **CGTMSE Cover:** This client qualifies for the **Credit Guarantee Fund Trust for Micro and Small Enterprises** scheme, enabling collateral-free coverage up to INR 5 Crore.
2. **ULI Integration:** Leverage the **Unified Lending Interface (ULI)** to pull direct GST-GSTR-1 invoices for instant cash-flow bill discounting.`;
  }

  if (msgLower.includes('scheme') || msgLower.includes('government') || msgLower.includes('mudra')) {
    return `### Recommended Government Support Schemes for **${msme.name}**

Given their sector (**${msme.sector}**), region, and profile, they are highly suitable for:

1. **CGTMSE Scheme (Credit Guarantee Scheme)**
   * **Purpose:** Enables collateral-free term loans and working capital lines.
   * **Relevance:** Ideal for ${msme.name} as they expand operations without pledging physical properties.
2. **Mudra Loan (Pradhan Mantri MUDRA Yojana - PMMY)**
   * **Relevance:** Since they employ ${msme.employee_count} workers, they fit into the **Tarun** category (INR 5L to 10L) or **Uday** (up to 20L) for service/retail scaling.
3. **PSB Loans in 59 Minutes**
   * **Relevance:** Direct integration with GST and Income Tax files makes this digital marketplace a prime channel for fast in-principle approvals.`;
  }

  if (msgLower.includes('risk') || msgLower.includes('weakness') || msgLower.includes('bounce') || msgLower.includes('overdraft')) {
    const risks = explanation.risks.map((r: string) => `* **${r}**`).join('\n');
    return `### Credit Risk Assessment for **${msme.name}**

Our scoring engine flagged the following constraints:
${risks}

**Detailed Cash Flow Audit:**
* **ECS/Cheque Bounces:** **${totalBounces}** recorded. Bounces heavily penalize the cash flow subscore, triggering compliance alarms.
* **Working Capital Stress:** Average overdraft utilization sits at **${overdraftUtilization}%**, leaving no headroom for inventory purchase.`;
  }

  // Default response
  return `### CreditPulse CFO Analysis: **${msme.name}**

I have analyzed the alternate data profiles for **${msme.name}** (${msme.sector}). Here is the summary of my findings:

* **Multidimensional Score:** **${score.composite_score} / 100** (Grade: **${score.grade}**, **${score.risk_band} Risk**)
* **Strongest Pillar:** **Compliance** (${score.dimension_scores.compliance_formalization}/100) due to stable filing.
* **Key Constraint:** **Repayment Capacity** (${score.dimension_scores.repayment_capacity}/100) influenced by leverage.

What specific credit metrics, cash flow trends, or government schemes would you like to review for this borrower?`;
}
