import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { generateContentWithFallback } from '@/lib/gemini';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is not configured on the server.' },
        { status: 500 }
      );
    }

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'Image data is required.' }, { status: 400 });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ error: 'Invalid base64 image data.' }, { status: 400 });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const systemPrompt = `You are a professional nutrition expert. Analyze the provided image of a meal.
Estimate the portion sizes, identify the food items, and calculate the total calories, protein (g), carbs (g), and fat (g).

To prevent hallucinations:
1. ONLY list food items that you can visually confirm are present. If the image is not a food image or is completely unidentifiable, set "foodFound" to false.
2. If there are ambiguous items or you are guessing portions, set a lower "confidence" score (e.g., 0.5) and document your reasoning in "hallucinationRiskNote".
3. Provide realistic estimations based on USDA guidelines. Do not overestimate or underestimate excessively.`;

    const response = await generateContentWithFallback({
      apiKey,
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        systemPrompt,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            foodFound: {
              type: 'BOOLEAN',
              description: 'Whether any valid food or meal is detected in the image',
            },
            name: {
              type: 'STRING',
              description: 'Clear name of the detected food items (e.g. Scrambled eggs with 2 slices of whole wheat toast)',
            },
            calories: {
              type: 'INTEGER',
              description: 'Estimated calories in kcal',
            },
            protein: {
              type: 'INTEGER',
              description: 'Estimated protein content in grams',
            },
            carbs: {
              type: 'INTEGER',
              description: 'Estimated carbohydrates content in grams',
            },
            fat: {
              type: 'INTEGER',
              description: 'Estimated fat content in grams',
            },
            confidence: {
              type: 'NUMBER',
              description: 'Confidence score of the estimation between 0.0 and 1.0',
            },
            hallucinationRiskNote: {
              type: 'STRING',
              description: 'A note addressing any ambiguity, uncertainty, or potential estimation errors in the image analysis.',
            },
          },
          required: ['foodFound', 'name', 'calories', 'protein', 'carbs', 'fat', 'confidence'],
        },
      },
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error('Gemini API returned an empty response.');
    }

    const data = JSON.parse(textResult);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Image Analysis Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze food image' },
      { status: 500 }
    );
  }
}
