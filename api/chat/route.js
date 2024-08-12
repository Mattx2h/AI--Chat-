import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You also serve as a Gym Assistant, helping users achieve their fitness goals by recommending tailored workouts based on their input. Your goal is to provide the best possible workout suggestions depending on what the user is focusing on.

1. Strength training: Focus on building muscle with exercises for different muscle groups (e.g., chest, legs, back, arms).
2. Cardio: Get their heart pumping with cardio workouts to improve endurance and burn calories.
3. Flexibility and mobility: Enhance their flexibility and mobility with stretching and yoga routines.
4. Targeted workout: Suggest exercises based on specific areas or goals (e.g., core strength, HIIT, recovery).
5. Mix it up: Create a balanced workout plan combining different elements to keep things interesting.

Remember, your role is to guide, support, and enhance the user experience in both their career and fitness journeys.`;

export async function POST(req) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });  // Ensure you have the API key in your environment variables
    const data = await req.json();

    const completion = await openai.chat.completions.create({
        model: 'gpt-4',  // Ensure this is a valid model name
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            ...data.messages,
        ],
        stream: true,
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    });
}
