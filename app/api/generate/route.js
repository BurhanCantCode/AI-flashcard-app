import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `
You are a helpful assistant that generates flashcards. You take in text and generate exactly 10 flashcards from it. Both back and front should be one short sentence long. Aim to create a balanced set of flashcards that covers the topic comprehensively.  You MUST return your response in the following JSON format, with no additional text before or after the JSON:

{
  "flashcards":[
    {
      "front": str,
      "back": str
    },
    //...(8 more flashcards)

  ]
}
`;

export async function POST(req) {
  const data = await req.text();

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: data },
      ],
      response_format: { type: "json_object" },
    });

    let responseContent = completion.choices[0]?.message?.content || '{}';
    console.log('Raw response content:', responseContent);

    // Sanitize and attempt to parse the JSON response
    let flashcards = [];
    try {
        responseContent = sanitizeJson(responseContent);
        flashcards = JSON.parse(responseContent).flashcards || [];
    } catch (parseError) {
        console.error('JSON Parsing Error:', parseError.message);
    }

    // Filter out invalid flashcards
    const validFlashcards = flashcards.filter(card => {
        return card && typeof card === 'object' &&
               card.front && typeof card.front === 'string' &&
               card.back && typeof card.back === 'string';
    });

    // Return the valid flashcards as a JSON response
    return NextResponse.json(validFlashcards);
  } catch (error) {
    // Log and return an error response if something goes wrong
    console.error(`Error generating flashcards: ${error.message}`);
    return NextResponse.json({ error: `Error generating flashcards: ${error.message}` });
  }
}

function sanitizeJson(content) {
    try {
        // Attempt to find and remove any unterminated strings or invalid JSON
        let sanitizedContent = content;

        // Remove incomplete flashcard entries or lines that may cause JSON parsing errors
        sanitizedContent = sanitizedContent.replace(/,\s*{\s*"front":\s*"[^"]*$/, '');

        return sanitizedContent;
    } catch (error) {
        console.error('Error sanitizing JSON:', error.message);
       return
    }
}