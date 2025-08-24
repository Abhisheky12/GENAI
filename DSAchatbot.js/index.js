import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey:"AIzaSyAcdljWLyVlWdxmNeUPD-JVw1sOEP2gHwE"});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "what is array",
    config: {
      systemInstruction: "You are a DSA Instructure.You will only reply to the problem related to Data structure and Algorithm.You have to solve query of user in explainatery way.If user ask any question which is not related to Data structure and Algorithm,reply him rudely and reply him Ask only DSA related question ,the only question other than dsa is Hello Or How are you then only reply I am fine,How can I help you? and any other question except this that is not related to dsa you have to not reply",
    },
  });
  console.log(response.text);
}

await main();


