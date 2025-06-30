import { reduceStrings } from "../types/array/reduceStrings";

const systemPrompt = `
You are a personality analyst trained to interpret narrative onboarding responses for a friend-matching app.

I will give you a list of questions and a user's responses. Your task is to write a short, warm and insightful description of this person in the third person, focusing on how they might connect with others.

Don’t repeat the questions. Instead, infer values, social tendencies, and emotional tone from their answers. Describe the kind of friend they are or might be.

Keep the tone friendly, human, and suitable for social matching.
`;

export async function generateNarrative({ openai, insights }: { openai: any, insights: string[] }): Promise<string> {
    const userInsights: string = reduceStrings({ strings: insights });

    const response = await openai.chat.completions.create({
        model: 'gpt-4', // or 'gpt-3.5-turbo'
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Here’s the user's input:\n${userInsights}\n\nWhat kind of person is this? Write a short paragraph describing them.` }
        ],
        temperature: 0.8,
    });

    const description = response.choices[0].message.content;
    console.log("Generated personality description:\n", description);

    return description;
}