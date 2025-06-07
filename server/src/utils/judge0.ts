
import axios from "axios";


export type Judge0Submission = {
    source_code: string;
    language_id: number;
    stdin: string;
    expected_output?: string;
  };
  

export const getJudge0LanguageId = ({ language }: { language: string }) => {
    const languageMap = {
        "PYTHON": 71,
        "JAVA": 62,
        "JAVASCRIPT": 63,
    }

    // Check if the language is in the map
    if (language in languageMap) {
        return languageMap[language as keyof typeof languageMap];
    }
      
    // throw an error if the language is not supported
    throw new Error(`Unsupported language: ${language}`);
}

export const pollBatchResults = async ({ tokens }: { tokens: string[] }) => {
    while (true) {
        const { data } = await axios.get(`${process.env.RAPIDAPI_URL}/submissions/batch`, {
            params: {
                tokens: tokens.join(","),
                base64_encoded: true,
                fields: "*"
            },
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
        });

        const results = data.submissions;

        const isAllDone = results.every(
            (results: { status: { id: number } }) => results.status.id >= 3
        )

        if (isAllDone) {
            console.log("All submissions are done");
            return results;
        }

        console.log("Waiting for submissions to complete...");
        console.log("Submission results: ", results);

        // wait for 3 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }
}

export const submitBatch = async (submissions: Judge0Submission[]) => {
    try {
        const { data } = await axios.post(
            `${process.env.RAPIDAPI_URL}/submissions/batch`, 
            { submissions },
            {
                params: {
                    base64_encoded: false
                },
                headers: {
                    'content-type': 'application/json',
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
                }
            },
        );
        
        console.log("Submission results(token): ", data);
        return data;
    } catch (error) {
        console.error("Error submitting batch:", error);
        throw error;
    }
}

export function getLanguageNmae(languageId: number) {
    const LANGUAGE_NAME = {
        71: "PYTHON",
        62: "JAVA",
        63: "JAVASCRIPT",
    }
    return LANGUAGE_NAME[languageId as keyof typeof LANGUAGE_NAME] || "UNKNOWN";
}