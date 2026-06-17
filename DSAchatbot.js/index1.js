import * as dotenv from 'dotenv';
dotenv.config();

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Custom embedding function using Google GenAI directly
async function embedText(text) {
    const response = await genAI.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        config: {
            outputDimensionality: 768,
        },
    });
    return response.embeddings[0].values;
}

// Custom embeddings wrapper for LangChain
class SimpleEmbeddings {
    async embedDocuments(documents) {
        const embeddings = [];
        for (const doc of documents) {
            const embedding = await embedText(doc);
            embeddings.push(embedding);
        }
        return embeddings;
    }

    async embedQuery(query) {
        return await embedText(query);
    }
}


async function indexDocument() {
    //load pdf
    const PDF_PATH = './dsa.pdf';
    const pdfLoader = new PDFLoader(PDF_PATH);
    const rawDocs = await pdfLoader.load();
    // console.log(rawDocs.length);
    console.log("pdf loaded");

    //chunking of pdf
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000, //1000  word in one chunk
        chunkOverlap: 200, //200 word overlap in between chunks
    });
    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);
    // console.log(chunkedDocs.length);
    console.log("chunking done");



    // Convert chunk into vector
    const embeddings = new SimpleEmbeddings();

    // Test embedding model
    // const testEmbed = await embeddings.embedQuery("test");
    // console.log(`Embedding model configured - vector dimension: ${testEmbed.length}`);


    const filteredDocs = chunkedDocs.filter(doc =>
        doc.pageContent && doc.pageContent.trim().length > 0
    );

    console.log("Original chunks:", chunkedDocs.length);
    console.log("Filtered chunks:", filteredDocs.length);



    // Configure pinecone database
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    console.log("pinecone database configured");


    // langchain(chunking,embedding,database)
    await PineconeStore.fromDocuments(filteredDocs, embeddings, {
        pineconeIndex,
        maxConcurrency: 5,
    });

    console.log("data stored successfully");

}


indexDocument().catch((err) => {
    console.error("Error indexing document:", err.message);
    process.exit(1);
});  