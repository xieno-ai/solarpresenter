import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { extractedBillSchema, ExtractBillResult } from '@/lib/bill/schema';
import { BILL_EXTRACTION_PROMPT } from '@/lib/bill/prompt';

export const runtime = 'nodejs';
export const maxDuration = 60; // Gemini typically responds in 5-15s; 60s safety margin

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

// Accepted file types for utility bill uploads
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
];

export async function POST(request: NextRequest): Promise<Response> {
  // 1. Parse multipart form data
  // NOTE: Do NOT set Content-Type on the client fetch — browser sets the multipart boundary automatically.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { status: 'error', fields: null, message: 'Invalid form data' } satisfies ExtractBillResult,
      { status: 400 },
    );
  }

  // 2. Validate file presence
  const file = formData.get('file') as File | null;
  if (!file) {
    return Response.json(
      { status: 'error', fields: null, message: 'No file provided' } satisfies ExtractBillResult,
      { status: 400 },
    );
  }

  // 3. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return Response.json(
      {
        status: 'error',
        fields: null,
        message: `Unsupported file type: ${file.type}. Accepted types: PDF, JPEG, PNG, HEIC.`,
      } satisfies ExtractBillResult,
      { status: 400 },
    );
  }

  // 4. Validate file size — Vercel serverless functions cap at 4.5MB; enforce 4MB here
  if (file.size > 4 * 1024 * 1024) {
    return Response.json(
      {
        status: 'error',
        fields: null,
        message: 'File exceeds 4MB limit. Please compress the image or use a smaller scan.',
      } satisfies ExtractBillResult,
      { status: 413 },
    );
  }

  // 5. Convert file to base64 for Gemini inline data
  const base64Data = Buffer.from(await file.arrayBuffer()).toString('base64');

  try {
    // 6. Call Gemini Flash with inline file data and structured output schema
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: BILL_EXTRACTION_PROMPT },
        { inlineData: { mimeType: file.type, data: base64Data } },
      ],
      config: {
        responseMimeType: 'application/json',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: zodToJsonSchema(extractedBillSchema as any),
      },
    });

    // 7. Parse and validate response with Zod (guarantees typed fields, catches partial/missing)
    const raw = JSON.parse(response.text ?? '{}');
    const fields = extractedBillSchema.parse(raw);

    // 8. Determine status based on how many fields were successfully extracted
    const scalarFields = [
      fields.annualKwh,
      fields.allInRateCentsPerKwh,
      fields.energyRateCentsPerKwh,
      fields.utilityProvider,
      fields.accountHolderName,
      fields.serviceAddress,
    ];
    const hasMonthly = fields.monthlyKwh !== null;
    const nonNullScalars = scalarFields.filter((v) => v !== null).length;
    const totalNonNull = nonNullScalars + (hasMonthly ? 1 : 0);

    let status: ExtractBillResult['status'];
    if (totalNonNull === 0) {
      // No fields extracted at all
      status = 'error';
      return Response.json({
        status,
        fields,
        message: 'Could not extract data from this document. Please check that it is a utility bill.',
      } satisfies ExtractBillResult);
    } else if (totalNonNull < 7) {
      // Some fields found, some missing
      status = 'partial';
    } else {
      // All fields extracted
      status = 'success';
    }

    // 9. Return HTTP 200 always — client reads status field, not HTTP code (same as /api/scrape)
    return Response.json({ status, fields } satisfies ExtractBillResult);
  } catch (err) {
    // Gemini call or Zod parse failed
    const message = err instanceof Error ? err.message : 'Extraction failed — unknown error';
    return Response.json(
      { status: 'error', fields: null, message } satisfies ExtractBillResult,
    );
  }
}
