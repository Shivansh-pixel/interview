import { GoogleGenerativeAI } from '@google/generative-ai';
import { backOff } from 'exponential-backoff';

const genAI = new GoogleGenerativeAI('AIzaSyBoZF2DMJCD6XILkRXJbolwj5bbTeXJ1wU');

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;
const MAX_DELAY = 10000;

const generateWithRetry = async (prompt: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  return backOff(
    async () => {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        if (error instanceof Error && error.message.includes('503')) {
          throw error;
        }
        throw new Error('Failed to generate content: ' + error);
      }
    },
    {
      numOfAttempts: MAX_RETRIES,
      startingDelay: INITIAL_DELAY,
      maxDelay: MAX_DELAY,
      retry: (error, attemptNumber) => {
        console.log(`Retry attempt ${attemptNumber} due to error:`, error);
        return true;
      },
    }
  );
};

export const generateQuestion = async (difficulty: string, topic: string = 'general', context: string = '') => {
  const prompt = `You are conducting a ${difficulty} level technical interview about ${topic}. 
${context ? `Based on the previous discussion: ${context}\n` : ''}
Ask a relevant follow-up question that builds upon the conversation naturally.
The question should be direct and professional.

Only provide the question itself, no additional formatting or text.`;

  try {
    const response = await generateWithRetry(prompt);
    return response.trim();
  } catch (error) {
    console.error('Error generating question:', error);
    throw new Error(`Failed to generate question after ${MAX_RETRIES} attempts. Please try again later.`);
  }
};

export const evaluateAnswer = async (
  question: string,
  answer: string,
  context: string = ''
) => {
  const prompt = `
    You are an expert technical interviewer. Evaluate this answer professionally and provide constructive feedback.
    ${context ? `Previous context of the interview: ${context}\n` : ''}
    
    Question: ${question}
    Answer: ${answer}
    
    Respond in a conversational yet professional tone. Include:
    1. A brief evaluation of the answer
    2. What was good about it
    3. What could be improved
    4. A score out of 10
    
    Keep the response natural and conversational, as if you're speaking directly to the candidate.
    `;

  try {
    const response = await generateWithRetry(prompt);
    return response.trim();
  } catch (error) {
    console.error('Error evaluating answer:', error);
    throw new Error(`Failed to evaluate answer after ${MAX_RETRIES} attempts. Please try again later.`);
  }
};