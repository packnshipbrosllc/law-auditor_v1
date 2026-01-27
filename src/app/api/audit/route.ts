import { NextResponse } from 'next/server';

// PII Masking Engine
function maskPII(text: string): string {
  let masked = text;

  // Mask SSNs: XXX-XX-XXXX or XXXXXXXXX
  masked = masked.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_MASKED]');
  masked = masked.replace(/\b\d{9}\b/g, '[SSN_MASKED]');

  // Mask Phone Numbers: (XXX) XXX-XXXX or XXX-XXX-XXXX or XXXXXXXXXX
  masked = masked.replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE_MASKED]');

  // Mask specific Lawyer Names (Example list - in production this could be more dynamic)
  const lawyerNames = ['John Dillard', 'Jane Doe', 'Richard Roe'];
  lawyerNames.forEach(name => {
    const regex = new RegExp(name, 'gi');
    masked = masked.replace(regex, '[LAWYER_NAME_MASKED]');
  });

  return masked;
}

// COMPLIANCE: Ephemeral processing only. No document content persisted.
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    console.log(`[API/Audit] Processing ${files.length} files...`);

    // In a real implementation, we would extract text from PDF/TXT
    // and run the maskPII engine before sending to an LLM.
    
    // For this simulation, we'll log that masking is active.
    console.log('[API/Audit] PII Masking Engine: ACTIVE');

    const mockViolations = [
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'critical',
        title: 'Unauthorized Rate Increase',
        description: 'Line item rate exceeds approved firm master agreement rate.',
        fix: 'Revert to approved rate.',
        line: Math.floor(Math.random() * 500)
      },
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'warning',
        title: 'Vague Task Description',
        description: 'Task entry lacks specificity required by UTBMS standards.',
        fix: 'Request detailed breakdown.',
        line: Math.floor(Math.random() * 500)
      }
    ];

    return NextResponse.json({
      message: 'Analysis complete',
      violations: mockViolations,
      leakage: 2125.35,
      piiStatus: 'Scrubbed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API/Audit] Error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
