// https://disney-clone-sg.azurewebsites.net/api/getaisuggestion

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let lastApiCallTimestamp = 0;
const minimumTimeBetweenCalls = 1000; 

export async function getAISuggestion(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    
    const now = Date.now();
    if (now - lastApiCallTimestamp < minimumTimeBetweenCalls) {
        return { status: 429, body: "Rate limit exceeded. Please try again later." };
    }
    
    context.log(`Http function processed request for url "${request.url}"`);

    const term = request.query.get('term');
    
    const completion = await openai.chat.completions.create({  
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: "You are a digital video assistant working for services such as Netflix, Hulu, Disney+ and Amazon Prime Video. Your job is to provide suggestions based on the videos the user specifies. Provide an quirky breakdown of what the users should watch next! It should only list the names of the films after the introduction. Keep the response short and sweet! Always list at least 3 films as suggestions. If the user mentioned a genre, you should provide a suggestion based on that genre",
            }, 
            {
                role: "user",
                content: `I like: ${term}`,
            },
        ], 
    });


    console.log(completion.choices[0].message.content);
    lastApiCallTimestamp = now;
    return { body: completion.choices[0].message.content || "No Suggestion" };
};

app.http('getAISuggestion', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getAISuggestion
});
