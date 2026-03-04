import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { extractedBillSchema, ExtractBillResult } from '@/lib/bill/schema';
import { BILL_EXTRACTION_PROMPT } from '@/lib/bill/prompt';

export const runtime = 'nodejs';
export const maxDuration = 60; // Gemini typically responds in 5-15s; 60s safety margin

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
];

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB per file

export async function POST(request: NextRequest): Promise<Response> {
  // 1. Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { status: 'error', fields: null, message: 'Invalid form data' } satisfies ExtractBillResult,
      { status: 400 },
    );
  }

  // 2. Collect all uploaded files (client appends each under the key 'file')
  const files = formData.getAll('file') as File[];
  if (files.length === 0) {
    return Response.json(
      { status: 'error', fields: null, message: 'No file provided' } satisfies ExtractBillResult,
      { status: 400 },
    );
  }

  // 3. Validate each file
  for (const file of files) {
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
    if (file.size > MAX_FILE_BYTES) {
      return Response.json(
        {
          status: 'error',
          fields: null,
          message: `"${file.name}" exceeds 4MB. Please compress or use a smaller scan.`,
        } satisfies ExtractBillResult,
        { status: 413 },
      );
    }
  }

  // 4. Convert all files to base64 inline data parts
  const fileParts = await Promise.all(
    files.map(async (file) => ({
      inlineData: {
        mimeType: file.type,
        data: Buffer.from(await file.arrayBuffer()).toString('base64'),
      },
    })),
  );

  try {
    // 5. Call Gemini with all pages/images as separate parts in one request
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: BILL_EXTRACTION_PROMPT },
        ...fileParts,
      ],
      config: {
        responseMimeType: 'application/json',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: zodToJsonSchema(extractedBillSchema as any),
      },
    });

    // 6. Parse and validate with Zod
    const raw = JSON.parse(response.text ?? '{}');
    const fields = extractedBillSchema.parse(raw);

    // 6a. Auto-compute annualKwh from monthly values if Gemini didn't return it
    if (fields.annualKwh === null && fields.monthlyKwh !== null) {
      const nonNullMonths = fields.monthlyKwh.filter((v): v is number => v !== null);
      if (nonNullMonths.length > 0) {
        fields.annualKwh = Math.round(nonNullMonths.reduce((sum, v) => sum + v, 0));
      }
    }

    // 7. Determine status
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
      return Response.json({
        status: 'error',
        fields,
        message: 'Could not extract data from this document. Please check that it is a utility bill.',
      } satisfies ExtractBillResult);
    } else if (totalNonNull < 7) {
      status = 'partial';
    } else {
      status = 'success';
    }

    return Response.json({ status, fields } satisfies ExtractBillResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed — unknown error';
    return Response.json(
      { status: 'error', fields: null, message } satisfies ExtractBillResult,
    );
  }
}
