import { GoogleGenAI } from '@google/genai';

export interface VocabularyAIResult {
  type: string;
  meaning: string;
  usageExamples: {
    sentence: string;
    translation: string;
  }[];
  synonyms: string[];
  antonyms: string[];
  wordFormVariations: {
    form: string;
    word: string;
  }[];
  commonPhrases: {
    phrase: string;
    meaning: string;
  }[];
}

export class VocabularyAIService {
  private genAI: GoogleGenAI;
  private model = 'gemma-3-12b-it';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  private cleanResponseText(text: string): string {
    // Remove markdown code blocks if present
    return text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a quota/rate limit error (429)
        const errorObj = error as { error?: { code?: number; details?: Array<{ retryDelay?: string }> }; status?: string };
        if (errorObj?.error?.code === 429 || errorObj?.status === 'RESOURCE_EXHAUSTED') {
          const retryDelay = errorObj?.error?.details?.[0]?.retryDelay
            ? parseInt(errorObj.error.details[0].retryDelay) * 1000
            : baseDelay * Math.pow(2, attempt);

          if (attempt < maxRetries - 1) {
            console.log(`Quota exceeded, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
        }

        // For other errors, throw immediately
        throw error;
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  async getWordDetails(word: string): Promise<VocabularyAIResult> {
    const prompt = `You are an expert English teacher and vocabulary specialist.
I need you to provide detailed information about the English word: "${word}"

Please provide the following information in JSON format:

1. **Type** (ประเภทคำ): Provide the part of speech/word type of this word (e.g., "noun", "verb", "adjective", "adverb", "preposition", "conjunction", "pronoun", "interjection", "determiner").
   - Use standard abbreviations if applicable (e.g., "n." for noun, "v." for verb, "adj." for adjective, "adv." for adverb)
   - Format: String

2. **Meaning** (ความหมาย): Provide a clear and concise meaning of the word in Thai language.
   - If the word has multiple meanings, provide the most common/useful meaning.
   - Format: Plain text in Thai

3. **Usage Examples** (ตัวอย่างการใช้งาน): Provide 2-3 example sentences showing how to use this word.
   - Each example should be practical and easy to understand.
   - Format: Array of objects with:
     - "sentence": The example sentence in English
     - "translation": The Thai translation of the sentence

4. **Synonyms** (คำพ้องความหมาย): Provide 2-3 synonyms (words with similar meaning).
   - Format: Array of strings
   - For each synonym, include the word type in parentheses after the word (e.g., "happy (adj.)", "joy (n.)")

5. **Antonyms** (คำตรงข้าม): Provide 1-2 antonyms (words with opposite meaning) if applicable.
   - If there are no clear antonyms, return an empty array.
   - Format: Array of strings
   - For each antonym, include the word type in parentheses after the word (e.g., "sad (adj.)", "sorrow (n.)")

6. **Word Form Variations** (รูปคำที่เกี่ยวข้อง): Provide related word forms (noun, verb, adjective, adverb, etc.)
   - For example, if the word is "happy", provide: happiness (noun), happily (adverb)
   - Format: Array of objects with:
     - "form": The word form (e.g., "noun", "verb", "adjective", "adverb")
     - "word": The actual word

7. **Common Phrases** (วลีที่ใช้บ่อย): Provide 1-2 common phrases or idioms that use this word.
   - Format: Array of objects with:
     - "phrase": The phrase in English
     - "meaning": The meaning in Thai

IMPORTANT:
- All Thai text should be in proper Thai language.
- Keep responses concise but informative.
- If any field is not applicable or cannot be determined, use null or empty array.
- Return ONLY valid JSON, do not include any markdown formatting, code blocks, or additional text.

Return the response as a JSON object with these exact field names:
{
  "type": string,
  "meaning": string,
  "usageExamples": [
    {
      "sentence": string,
      "translation": string
    }
  ],
  "synonyms": string[],
  "antonyms": string[],
  "wordFormVariations": [
    {
      "form": string,
      "word": string
    }
  ],
  "commonPhrases": [
    {
      "phrase": string,
      "meaning": string
    }
  ]
}`;

    try {
      const result = await this.retryWithBackoff(async () => {
        const response = await this.genAI.models.generateContent({
          model: this.model,
          contents: [prompt],
        });

        const { text } = response;
        if (!text) {
          throw new Error('Failed to generate response from AI');
        }

        const cleanedText = this.cleanResponseText(text);
        const parsedJSON = JSON.parse(cleanedText) as VocabularyAIResult;

        // Validate and ensure all fields exist
        return {
          type: parsedJSON.type || '',
          meaning: parsedJSON.meaning || '',
          usageExamples: parsedJSON.usageExamples || [],
          synonyms: parsedJSON.synonyms || [],
          antonyms: parsedJSON.antonyms || [],
          wordFormVariations: parsedJSON.wordFormVariations || [],
          commonPhrases: parsedJSON.commonPhrases || [],
        };
      });

      return result;
    } catch (error) {
      console.error('Failed to get word details from AI:', error);

      // Provide more helpful error messages
      const errorObj = error as { error?: { code?: number }; status?: string };
      if (errorObj?.error?.code === 429 || errorObj?.status === 'RESOURCE_EXHAUSTED') {
        throw new Error('Quota exceeded. Please check your Google AI API quota or try again later.');
      }

      throw new Error(`Failed to get word details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

