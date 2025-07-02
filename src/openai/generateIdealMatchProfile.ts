const matchSystemPrompt = `
You are a relationship advisor trained on matching users based on personality narratives.

I will give you a user's narrative. Your task is to infer what kind of personality would be the most compatible match for this person — for a friendship, not romance.

Respond with a short description of the ideal match’s personality, in the third person. Focus on qualities that would complement or resonate with the user's values, energy, and social tendencies.

This response will be embedded for semantic matching, so keep it concise, expressive, and reflective of a real person's vibe.
`;

export async function generateIdealMatchProfile({ openai, narrative }: { openai: any, narrative: string }): Promise<string> {
    const response = await openai.chat.completions.create({
        model: "gpt-4", // or 'gpt-3.5-turbo'
        messages: [
            { role: "system", content: matchSystemPrompt },
            { role: "user", content: `Here’s the user's input:\n${narrative}\n\nWhat kind of personality would be their ideal friend match?` },
        ],
        temperature: 0.8,
    });

    const matchDescription = response.choices[0].message.content;
    console.log("\nGenerated ideal match description:\n", matchDescription);

    return matchDescription;
}
