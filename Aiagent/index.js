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


// Get crypto price (real API call)
async function getCryptoPrice({ coin }) {
    try {
        const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coin.toLowerCase()}&vs_currencies=usd`
        );
        const data = await res.json();

        if (data[coin.toLowerCase()]) {
            return `$${data[coin.toLowerCase()].usd}`;
        } else {
            return "Coin not found";
        }
    } catch (err) {
        return "Error fetching price";
    }
}


async function getJoke() {
    try {
        const res = await fetch("https://official-joke-api.appspot.com/random_joke");
        const data = await res.json();

        return `${data.setup} — ${data.punchline}`;
    } catch (err) {
        return "Error fetching joke";
    }
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
const JokeDeclaration = {
    name: "getJoke",
    description: "Get the jokes for me ",
    parameters: {
        type: "OBJECT",
        properties: {}, // no arguments needed
        required: []
    }
}

// ---------------- Available Tools ----------------
const availableTools = {
    sum: sum,
    prime: prime,
    getCryptoPrice: getCryptoPrice,
    getJoke: getJoke
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
                systemInstruction: "you are ai agent ,you have access of 3 available tools ,use these tools whenever required to confirm user query. if user ask genral question then answer in your own way if tools are not required ",
                tools: [{ functionDeclarations: [sumDeclaration, primeDeclaration, cryptoDeclaration, JokeDeclaration] }]
            }
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
            for (const call of response.functionCalls) {
                const { name, args } = call;
                const tool = availableTools[name];
                const result = await tool(args);

                const functionResponsePart = { name, response: { result } };

                History.push({
                    role: "model",
                    parts: [{ functionCall: call }]
                });

                History.push({
                    role: "user",
                    parts: [{ functionResponse: functionResponsePart }]
                });
            }
        }
        else {
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
