
//in this we are maintaining history manually



import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";
import { text } from "stream/consumers";

const ai = new GoogleGenAI({ apiKey: "AIzaSyAcdljWLyVlWdxmNeUPD-JVw1sOEP2gHwE" });


const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [],
});



async function main() {

    const userProblem = readlineSync.question("Ask me any thing->");
    const response1 = await chat.sendMessage({
        message:userProblem,
    });
    
   console.log(response1.text);
   

    main();
}

await main();