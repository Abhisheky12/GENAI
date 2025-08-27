import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";

const ai = new GoogleGenAI({ apiKey: "AIzaSyAcdljWLyVlWdxmNeUPD-JVw1sOEP2gHwE" });

// ---------------- Tools ----------------

// Sum of two numbers
async function sum({ num1, num2 }) {
    return num1 + num2;
}

// Check if number is prime
async function prime({ num }) {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

// Get crypto price (mock function here)
async function getCryptoPrice({ coin }) {
    // You can call a real API here
    const mockPrices = { bitcoin: 30000, ethereum: 2000, dogecoin: 0.07 };
    return mockPrices[coin.toLowerCase()] || "Coin not found";
}

// ---------------- Tool Declarations ----------------

const sumDeclaration = {
    name: "sum",
    description: "Get the sum of two numbers",
    parameters: {
        type: "OBJECT",
        properties: {
            num1: { type: "NUMBER", description: "First number" },
            num2: { type: "NUMBER", description: "Second number" }
        },
        required: ["num1", "num2"]
    }
};

const primeDeclaration = {
    name: "prime",
    description: "Check if a number is prime",
    parameters: {
        type: "OBJECT",
        properties: {
            num: { type: "NUMBER", description: "Number to check" }
        },
        required: ["num"]
    }
};

const cryptoDeclaration = {
    name: "getCryptoPrice",
    description: "Get the current price of a crypto",
    parameters: {
        type: "OBJECT",
        properties: {
            coin: { type: "STRING", description: "Crypto coin name" }
        },
        required: ["coin"]
    }
};

// ---------------- Available Tools ----------------
const availableTools = {
    sum: sum,
    prime: prime,
    getCryptoPrice: getCryptoPrice
};

// ---------------- History ----------------
const History = [];

// ---------------- Agent ----------------
async function runAgent(userProblem) {
    History.push({ role: "user", parts: [{ text: userProblem }] });

    while (true) {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: History,
            config: {
                systemInstruction:"you are ai agent ,you have access of 3 available tools ,use these tools whenever required to confirm user query. if user ask genral question then answer in your own way if tools are not required ",
                tools: [{ functionDeclarations: [sumDeclaration, primeDeclaration, cryptoDeclaration] }]
            }
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
           
           console.log(response.functionCalls[0]);
           
            const { name, args } = response.functionCalls[0];

            const funCall = availableTools[name];
            const result = await funCall(args);

            const functionResponsePart = { name, response: { result } };

            // Maintain model history
            History.push({
                role: "model",
                parts: [{ functionCall: response.functionCalls[0] }]
            });

            // Maintain function response history
            History.push({
                role: "user",
                parts: [{ functionResponse: functionResponsePart }]
            });
        } else {
            History.push({ role: "model", parts: [{ text: response.text }] });
            console.log(response.text);
            break;
        }
    }
}

// ---------------- Main ----------------
async function main() {
    const userProblem = readlineSync.question("Ask me anything -> ");
    await runAgent(userProblem);
    main(); // recursive loop for continuous interaction
}

await main();







//working

// > User: sum of 2 and 4 and 7 is prime or not
// >> Sent to LLM with tool schemas

// < LLM: functionCall sum args '{"num1":2,"num2":4}'
// Console: Function call: sum { num1:2, num2:4 }
// Console: Sum result: 6
// >> Send functionResponse (sum -> 6) back to LLM

// < LLM: functionCall prime args '{"num":7}'
// Console: Function call: prime { num:7 }
// Console: Prime result: true
// >> Send functionResponse (prime -> true) back to LLM

// < LLM: final text "Sum of 2 and 4 is 6. 7 is prime."
// Console: Sum of 2 and 4 is 6. 7 is prime.
