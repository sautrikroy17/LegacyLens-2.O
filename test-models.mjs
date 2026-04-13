import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyD_g8vEThUOtsL2gV0L__aJ-ug0nv2Gghw");

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("hello");
    console.log(`[SUCCESS] ${modelName} worked!`);
    return true;
  } catch (e) {
    if (e.message.includes('503')) {
      console.log(`[503 OVERLOAD] ${modelName} is overloaded right now.`);
    } else {
      console.log(`[FAILED] ${modelName}: ${e.message.split('\\n')[0]}`);
    }
    return false;
  }
}

async function run() {
  await testModel('gemini-1.5-pro-latest');
  await testModel('gemini-1.5-flash-latest');
  await testModel('gemini-pro');
  await testModel('gemini-1.5-flash');
  await testModel('gemini-2.5-flash');
}

run();
