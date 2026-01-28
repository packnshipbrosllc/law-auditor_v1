import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Security Check: File Type
    const allowedTypes = [
      'application/pdf', 
      'text/csv', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Please upload PDF, CSV, or XLSX." 
      }, { status: 400 });
    }

    // Engineering Note: This is where we will integrate Vercel Blob or S3
    console.log(`[LawAuditor] Received file: ${file.name} for processing.`);

    return NextResponse.json({ 
      message: "Upload Successful. Analysis beginning.",
      fileId: Math.random().toString(36).substring(7) 
    });

  } catch (error) {
    console.error('[Upload Error]:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

