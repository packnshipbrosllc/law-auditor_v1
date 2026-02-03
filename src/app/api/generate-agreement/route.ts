import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getUserSettings } from '@/lib/db';

/**
 * POST /api/generate-agreement
 * 
 * Generate a California Standard Investigator Agreement PDF.
 * Based on CCP 1582 requirements from the Investigator Handbook.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      decedentName,
      propertyId,
      availableBalance,
      county,
      heirName,
      heirAddress,
      heirPhone,
      heirEmail,
    } = body;

    // Get investigator settings (registration number, business info)
    let settings;
    try {
      settings = await getUserSettings(userId);
    } catch {
      settings = null;
    }

    // Generate the PDF
    const pdfDoc = await PDFDocument.create();
    
    // Embed fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    
    // Add first page
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    // Colors
    const black = rgb(0, 0, 0);
    const darkGray = rgb(0.3, 0.3, 0.3);
    
    let y = height - 50;
    
    // ═══════════════════════════════════════════════════════════════════════
    // HEADER
    // ═══════════════════════════════════════════════════════════════════════
    
    page.drawText('CALIFORNIA STANDARD INVESTIGATOR AGREEMENT', {
      x: 72,
      y,
      size: 14,
      font: helveticaBold,
      color: black,
    });
    
    y -= 20;
    page.drawText('Unclaimed Property Claim Services Agreement', {
      x: 72,
      y,
      size: 10,
      font: helvetica,
      color: darkGray,
    });
    
    y -= 15;
    page.drawText('(Per California Code of Civil Procedure Section 1582)', {
      x: 72,
      y,
      size: 9,
      font: helvetica,
      color: darkGray,
    });
    
    // Horizontal line
    y -= 20;
    page.drawLine({
      start: { x: 72, y },
      end: { x: width - 72, y },
      thickness: 1,
      color: black,
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // PARTIES
    // ═══════════════════════════════════════════════════════════════════════
    
    y -= 30;
    page.drawText('PARTIES TO THIS AGREEMENT', {
      x: 72,
      y,
      size: 11,
      font: helveticaBold,
      color: black,
    });
    
    y -= 25;
    page.drawText('This Agreement is entered into on this date: ', {
      x: 72,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    page.drawText('_______________________', {
      x: 290,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 20;
    page.drawText('Between:', {
      x: 72,
      y,
      size: 10,
      font: helveticaBold,
      color: black,
    });
    
    // Owner/Heir Information
    y -= 20;
    page.drawText('OWNER/HEIR ("Client"):', {
      x: 72,
      y,
      size: 10,
      font: helveticaBold,
      color: black,
    });
    
    y -= 15;
    page.drawText(`Name: ${heirName || '________________________________________'}`, {
      x: 90,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 15;
    page.drawText(`Address: ${heirAddress || '________________________________________'}`, {
      x: 90,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 15;
    page.drawText(`Phone: ${heirPhone || '____________________'}  Email: ${heirEmail || '____________________'}`, {
      x: 90,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    // Investigator Information
    y -= 25;
    page.drawText('INVESTIGATOR ("Agent"):', {
      x: 72,
      y,
      size: 10,
      font: helveticaBold,
      color: black,
    });
    
    y -= 15;
    page.drawText(`Business Name: ${settings?.business_name || '________________________________________'}`, {
      x: 90,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 15;
    page.drawText(`Registration Number: ${settings?.investigator_registration_number || '________________________________________'}`, {
      x: 90,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 15;
    page.drawText(`Address: ${settings?.business_address || '________________________________________'}`, {
      x: 90,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 15;
    page.drawText(`Phone: ${settings?.business_phone || '____________________'}  Email: ${settings?.business_email || '____________________'}`, {
      x: 90,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // PROPERTY INFORMATION
    // ═══════════════════════════════════════════════════════════════════════
    
    y -= 30;
    page.drawText('PROPERTY INFORMATION', {
      x: 72,
      y,
      size: 11,
      font: helveticaBold,
      color: black,
    });
    
    y -= 20;
    page.drawText(`Decedent Name: ${decedentName || '________________________________________'}`, {
      x: 90,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 15;
    page.drawText(`Property ID: ${propertyId || '________________________________________'}`, {
      x: 90,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 15;
    page.drawText(`County: ${county || '________________________________________'}`, {
      x: 90,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 15;
    const formattedBalance = availableBalance 
      ? `$${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '$__________.00';
    page.drawText(`Estimated Available Balance: ${formattedBalance}`, {
      x: 90,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // FEE AGREEMENT (10% CAP - CCP 1582)
    // ═══════════════════════════════════════════════════════════════════════
    
    y -= 30;
    page.drawText('FEE AGREEMENT', {
      x: 72,
      y,
      size: 11,
      font: helveticaBold,
      color: black,
    });
    
    y -= 20;
    const feeText1 = 'Client agrees to pay Agent a fee of TEN PERCENT (10%) of the total amount recovered,';
    page.drawText(feeText1, {
      x: 72,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 15;
    const feeText2 = 'which is the maximum fee allowed under California Code of Civil Procedure Section 1582.';
    page.drawText(feeText2, {
      x: 72,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 20;
    const estimatedFee = availableBalance 
      ? `$${(availableBalance * 0.10).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '$__________.00';
    page.drawText(`Estimated Fee (10% of ${formattedBalance}): ${estimatedFee}`, {
      x: 90,
      y,
      size: 10,
      font: helveticaBold,
      color: black,
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // REQUIRED DISCLOSURE (CCP 1582)
    // ═══════════════════════════════════════════════════════════════════════
    
    y -= 30;
    page.drawText('REQUIRED DISCLOSURE', {
      x: 72,
      y,
      size: 11,
      font: helveticaBold,
      color: black,
    });
    
    y -= 20;
    // Draw a box around the disclosure
    page.drawRectangle({
      x: 72,
      y: y - 60,
      width: width - 144,
      height: 75,
      borderColor: black,
      borderWidth: 1,
    });
    
    y -= 15;
    page.drawText('IMPORTANT NOTICE:', {
      x: 82,
      y,
      size: 9,
      font: helveticaBold,
      color: black,
    });
    
    y -= 12;
    page.drawText('You have the right to claim this property directly from the California State Controller\'s', {
      x: 82,
      y,
      size: 9,
      font: timesRoman,
      color: black,
    });
    
    y -= 12;
    page.drawText('Office FREE OF CHARGE by visiting: https://claimit.ca.gov', {
      x: 82,
      y,
      size: 9,
      font: timesRoman,
      color: black,
    });
    
    y -= 12;
    page.drawText('California law limits the fee an agent may charge to 10% of the property value.', {
      x: 82,
      y,
      size: 9,
      font: timesRoman,
      color: black,
    });
    
    y -= 12;
    page.drawText('This agreement complies with California Code of Civil Procedure Section 1582.', {
      x: 82,
      y,
      size: 9,
      font: timesRoman,
      color: black,
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // TERMS AND CONDITIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    y -= 35;
    page.drawText('TERMS AND CONDITIONS', {
      x: 72,
      y,
      size: 11,
      font: helveticaBold,
      color: black,
    });
    
    const terms = [
      '1. Agent agrees to research and process the claim on behalf of Client.',
      '2. Agent will prepare and file all necessary documentation with the State Controller.',
      '3. Client authorizes Agent to act as their representative for this claim only.',
      '4. Fee is due only upon successful recovery of property.',
      '5. This agreement may be cancelled within 30 days of signing.',
      '6. Agent shall not charge any fees beyond the 10% specified herein.',
    ];
    
    y -= 20;
    for (const term of terms) {
      page.drawText(term, {
        x: 72,
        y,
        size: 9,
        font: timesRoman,
        color: black,
      });
      y -= 14;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SIGNATURES
    // ═══════════════════════════════════════════════════════════════════════
    
    y -= 30;
    page.drawText('SIGNATURES', {
      x: 72,
      y,
      size: 11,
      font: helveticaBold,
      color: black,
    });
    
    y -= 30;
    // Client signature
    page.drawText('Client Signature: ________________________________', {
      x: 72,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    page.drawText('Date: ______________', {
      x: 380,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 20;
    page.drawText(`Print Name: ${heirName || '________________________________'}`, {
      x: 72,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 30;
    // Agent signature
    page.drawText('Agent Signature: ________________________________', {
      x: 72,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    page.drawText('Date: ______________', {
      x: 380,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 20;
    page.drawText(`Print Name: ${settings?.business_name || '________________________________'}`, {
      x: 72,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    y -= 15;
    page.drawText(`Registration #: ${settings?.investigator_registration_number || '________________________________'}`, {
      x: 72,
      y,
      size: 10,
      font: timesRoman,
      color: black,
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════════════════════
    
    page.drawText('Generated by LawAuditor | CCP 1582 Compliant | Page 1 of 1', {
      x: 72,
      y: 30,
      size: 8,
      font: helvetica,
      color: darkGray,
    });
    
    page.drawText(new Date().toLocaleDateString(), {
      x: width - 120,
      y: 30,
      size: 8,
      font: helvetica,
      color: darkGray,
    });
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Convert to Buffer for NextResponse
    const buffer = Buffer.from(pdfBytes);
    
    // Return as PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Agreement_${propertyId || 'Standard'}.pdf"`,
      },
    });
    
  } catch (error) {
    console.error('POST /api/generate-agreement error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate agreement' },
      { status: 500 }
    );
  }
}
