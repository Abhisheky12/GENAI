import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises"; // ✅ for writing inside files
import os from "os";

const platform = os.platform();
const ai = new GoogleGenAI({ apiKey: "AIzaSyAcdljWLyVlWdxmNeUPD-JVw1sOEP2gHwE" });

const asyncExecute = promisify(exec);

// ---------------- Tool Functions ----------------
async function executeCommand({ command, filePath, content }) {
    try {
        // case 1: execute normal terminal command
        if (command) {
            const { stdout, stderr } = await asyncExecute(command);
            if (stderr) return stderr;
            return `success:${stdout} || Task executed completely`;
        }

        // case 2: write content into a file
        if (filePath && content) {
            await fs.writeFile(filePath, content, "utf-8");
            return `✅ Content written to ${filePath}`;
        }

        return "⚠️ Nothing executed, no valid input.";
    } catch (error) {
        return error.message;
    }
}

// ---------------- Tool Declaration ----------------
const executeCommandDeclaration = {
    name: "executeCommand",
    description: "execute terminal command or write content to a file",
    parameters: {
        type: "OBJECT",
        properties: {
            command: { type: "STRING", description: "Terminal command (ex: mkdir myApp)" },
            filePath: { type: "STRING", description: "Path of file where content should be written" },
            content: { type: "STRING", description: "Content to be written inside the file" }
        }
    }
};

// ---------------- Available Tools ----------------
const availableTools = {
    executeCommand
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
                systemInstruction: `You are an website builder expert. 
        You have to create the frontend of the website by analysing the user input.
        You have access to a tool which can execute any shell/terminal command.
        Current user operating system is: ${platform}.
        
        <--- Your Job --->
        1: Analyse the user query to see what type of website they want to build
        2: Give them commands one by one 
        3: Use available tool

        Steps to follow:
        1: First create a folder
        2: Inside the folder, create index.html
        3: Then create style.css
        4: Then create script.js
        5: Then write code in these files
        `,
                tools: [{ functionDeclarations: [executeCommandDeclaration] }]
            }
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
            for (const call of response.functionCalls) {
                const { name, args } = call;
                const tool = availableTools[name];
                if (!tool) {
                    console.log("❌ Tool not found");
                    continue;
                }
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
        } else {
            History.push({ role: "model", parts: [{ text: response.text }] });
            console.log(response.text);
            break;
        }
    }
}

// ---------------- Main ----------------
async function main() {
    console.log("👋 I am cursor, let's create a website!");
    const userProblem = readlineSync.question("Ask me anything -> ");
    await runAgent(userProblem);
    main();
}

await main();
