import OpenAI from "openai";

const geminiApiKey = process.env.GEMINI_API_KEY;

const openai = geminiApiKey ? new OpenAI({
    apiKey: geminiApiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/models",
}) : null;

if (!openai) {
    console.log("🚨 GEMINI_API_KEY is not set. AI features will be disabled.");
}

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface ChatOptions {
    systemInstruction: string;
    history: ChatMessage[];
    userQuestion: string;
}

export async function getAIChatResponse(options: ChatOptions): Promise<string> {
    const { systemInstruction, history, userQuestion } = options;

    if (!openai) {
        throw new Error("AI service is not available. Check API key.");
    }

    const messages: ChatMessage[] = [
        { role: "system", content: systemInstruction },
        ...history,
        { role: "user", content: userQuestion },
    ];

    try {
        const response = await openai.chat.completions.create({
            messages,
            model: "gemini-2.5-flash", // The model name is specified here
            max_tokens: 3000,
            temperature: 1.0,
        });

        const aiResponse = response.choices[0]?.message?.content;

        if (!aiResponse) {
            throw new Error("AI returned an empty response.");
        }

        return aiResponse;

    } catch (error) {
        console.error("Error communicating with AI API:", error);
        throw new Error("Failed to get a response from the AI service.");
    }
}


// tyring a different approach with google gemini

// export async function getAIChatResponse(options: ChatOptions): Promise<string> {
//     const { systemInstruction, history, userQuestion } = options;

//     // For now, we only have the Gemini provider.
//     // In the future, you could have a switch/case or a factory here based on a `provider` option.
//     if (!genAI) {
//         throw new Error("Gemini AI service is not available. Check API key.");
//     }

//     try {
//         const model = genAI.getGenerativeModel({
//             model: "gemini-pro",
//             systemInstruction,
//         });

//         const chat = model.startChat({
//             history,
//             generationConfig: {
//                 maxOutputTokens: 1000,
//             },
//             safetySettings: [
//                 { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//                 { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//             ],
//         });

//         const result = await chat.sendMessage(userQuestion);
//         const aiResponse = result.response.text();
//         return aiResponse;

//     } catch (error) {
//         console.error("Error communicating with Gemini API:", error);
//         // Re-throw a more generic error to be caught by the controller's error handler.
//         throw new Error("Failed to get a response from the AI service.");
//     }
// }

// Future implementation could look like this:
// export async function getOpenAIChatResponse(options: ChatOptions): Promise<string> {
//     // ... logic using the 'openai' SDK
// }
