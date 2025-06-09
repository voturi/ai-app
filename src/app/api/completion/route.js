import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set max duration for Vercel Serverless Function
export const maxDuration = 30;

export async function POST(req) {
  try {
    // Parse the request body
    const body = await req.json();
    const userPrompt = body.prompt || 'Give a great quote from the web';
    console.log("Received prompt:", userPrompt);
    console.log("OpenAI API key present:", !!process.env.OPENAI_API_KEY);

    // Call OpenAI API directly for completion
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 150,
      stream: true, // Enable streaming
    });

    console.log("Stream generation initiated successfully");

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error("Error in POST handler:", error.message, error.stack);
    return new Response(JSON.stringify({ error: 'Failed to generate text', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}