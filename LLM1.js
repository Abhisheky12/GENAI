
//in this we are maintaining history manually



import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";
import { text } from "stream/consumers";

const ai = new GoogleGenAI({ apiKey: "AIzaSyAcdljWLyVlWdxmNeUPD-JVw1sOEP2gHwE" });


const History = []


async function Chatting(userProblem) {

    //maintaining user problem history 
    History.push({
        role: "user",
        parts: [{ text: userProblem }]
    })

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: History,
    });
    //maintaining model answer history
    History.push({
        role: "model",
        parts: [{ text: response.text }]
    })


    console.log(response.text);
}


async function main() {

    const userProblem = readlineSync.question("Ask me any thing->");
    await Chatting(userProblem);
    main();
}

await main();


//very good llm1 result 