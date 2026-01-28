import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';
import { auth } from '@clerk/nextjs/server';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * PII Masking Engine (regex-based)
 * Filters sensitive data before any processing or LLM transmission.
 */
function scrubPII(text: string): string {
  let scrubbed = text;
  scrubbed = scrubbed.replace(/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, '[SSN_MASKED]');
  scrubbed = scrubbed.replace(/(\+?1[- ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/g, '[PHONE_MASKED]');
  scrubbed = scrubbed.replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\b/g, '[DOB_MASKED]');
  
  const personnel = ['John Dillard', 'Jane Doe', 'Richard Roe', 'Steven Smith'];
  personnel.forEach(name => {
    const regex = new RegExp(name, 'gi');
    scrubbed = scrubbed.replace(regex, '[LAWYER_NAME_MASKED]');
  });

  return scrubbed;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    let combinedText = '';

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      if (file.type === 'application/pdf') {
        const pdf = require('pdf-parse');
        const data = await pdf(buffer);
        combinedText += `\n--- File: ${file.name} ---\n${data.text}`;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        combinedText += `\n--- File: ${file.name} ---\n${result.value}`;
      } else if (file.type === 'text/plain' || file.type === 'text/csv') {
        combinedText += `\n--- File: ${file.name} ---\n${buffer.toString('utf-8')}`;
      } else {
        console.warn(`[Audit API] Unsupported file type: ${file.type}`);
      }
    }

    if (!combinedText.trim()) {
      return NextResponse.json({ error: "Could not extract text from files" }, { status: 400 });
    }

    // Scrub PII before sending to AI
    const scrubbedText = scrubPII(combinedText);

    // Call Claude 3.5 Sonnet
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      temperature: 0, // Deterministic results
      system: `You are a Senior Legal Auditor. Your task is to audit legal or medical bills for compliance with ABA Model Rule 1.5 and standard Outside Counsel Guidelines (OCG).
Identify violations such as:
1. Block Billing (multiple tasks in one entry)
2. Task Inflation (routine tasks with excessive time)
3. Clerical Work billed at professional rates
4. Summer Associate / Junior training billed to client
5. Inter-office conferencing (multiple partners on one call)
6. Duplicate billing

Return ONLY a JSON array of objects. Do not include any introductory or concluding text.
Each object must have exactly these keys:
- "type": "critical" | "warning"
- "title": string (short name of the violation)
- "description": string (detailed explanation of the discrepancy)
- "fix": string (suggested remediation)
- "potentialRecovery": number (the dollar amount that should be deducted)
- "ruleCited": string (the specific ABA Rule or OCG section violated)

Example output:
[
  {
    "type": "critical",
    "title": "Block Billing Detected",
    "description": "Four distinct tasks (Research, Drafting, Filing, Emailing) were combined into a single 4.0 hour entry.",
    "fix": "Request task breakdown and re-submit as separate entries.",
    "potentialRecovery": 1200.00,
    "ruleCited": "OCG § 3.1: Task Segregation Requirements"
  }
]`,
      messages: [
        {
          role: "user",
          content: `Analyze the following billing data for violations:\n\n${scrubbedText}`,
        },
      ],
    });

    const responseText = msg.content[0].type === 'text' ? msg.content[0].text : '';
    
    // Attempt to parse the JSON
    let violations = [];
    try {
      // Find the start and end of the JSON array in case Claude included extra text
      const start = responseText.indexOf('[');
      const end = responseText.lastIndexOf(']') + 1;
      if (start !== -1 && end !== -1) {
        violations = JSON.parse(responseText.slice(start, end));
      } else {
        throw new Error("JSON markers not found in AI response");
      }
    } catch (e) {
      console.error("[Audit API] Failed to parse AI response:", responseText);
      return NextResponse.json({ error: "AI response was not valid JSON", raw: responseText }, { status: 500 });
    }

    const totalLeakage = violations.reduce((sum: number, v: any) => sum + (v.potentialRecovery || 0), 0);

    return NextResponse.json({
      message: 'Analysis complete',
      violations,
      leakage: totalLeakage,
      securityStatus: 'PII_SCRUBBED',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API/Audit] Error:', error);
    return NextResponse.json({ error: 'Data processing failed' }, { status: 500 });
  }
}
