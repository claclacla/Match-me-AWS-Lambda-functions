import { reduceStrings } from "../types/array/reduceStrings";

const systemPrompt = `
You are a group behavior analyst trained to interpret onboarding responses for a social app that builds small, diverse, and collaborative groups.

I will give you a list of questions and a user's responses. Your task is to write a short, insightful description of how this person tends to behave, interact, and contribute in small group settings.

Do not repeat the questions. Instead, infer how they relate to others, deal with tension, support or lead, and what role they naturally take on in a group. The tone should be warm, human, and socially perceptive.

Write the result in the third person, as if introducing this person to the rest of a new group.
`;

export async function generateGroupBehavior({
    openai,
    insights,
}: {
    openai: any;
    insights: string[];
}): Promise<string> {
    const userInsights: string = reduceStrings({ strings: insights });

    const response = await openai.chat.completions.create({
        model: "gpt-4", // or 'gpt-3.5-turbo'
        messages: [
            { role: "system", content: systemPrompt },
            {
                role: "user",
                content: `Here's what the user shared during onboarding:\n${userInsights}\n\nWhat kind of group member are they likely to be? Write a short paragraph describing them.`,
            },
        ],
        temperature: 0.8,
    });

    const description = response.choices[0].message.content;
    console.log("Generated group behavior description:\n", description);

    return description;
}
