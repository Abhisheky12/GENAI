import * as dotenv from 'dotenv';
dotenv.config();

import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { GoogleGenAI } from '@google/genai';
import readline from 'readline';

const genAIEmbed = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function embedText(text) {
    const response = await genAIEmbed.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        config: { outputDimensionality: 768 },
    });
    return response.embeddings[0].values;
}

class SimpleEmbeddings {
    async embedDocuments(docs) {
        const arr = [];
        for (const doc of docs) {
            arr.push(await embedText(doc));
        }
        return arr;
    }

    async embedQuery(query) {
        return await embedText(query);
    }
}

async function generateAnswer(query) {
    const embeddings = new SimpleEmbeddings();

    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    const vectorStore = await PineconeStore.fromExistingIndex(
        embeddings,
        { pineconeIndex: index }
    );

    const results = await vectorStore.similaritySearch(query, 2);

    const context = results.map(doc => doc.pageContent).join("\n\n");

    const prompt = `
Answer in 2 lines using only meaningful text.
Ignore numbers, tables, and irrelevant content.

Context:
${context}

Question:
${query}

Answer:
`;

    const genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt
        });

        console.log("\nAnswer:\n");
        console.log(response.text);

    } catch (err) {
        console.log("\nFallback Answer:\n");
        console.log(context);
    }
}

// terminal input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask() {
    rl.question("\nAsk: ", async (q) => {
        if (q.toLowerCase() === "exit") {
            rl.close();
            return;
        }
        await generateAnswer(q);
        ask();
    });
}

ask();