export const VOCABULARY_PROMPT = (word: string) => `
You are an expert English teacher and vocabulary specialist.
I need you to provide detailed information about the English word: "${word}"

Please provide the following information in JSON format:

1. **Meaning** (ความหมาย): Provide a clear and concise meaning of the word in Thai language.
   - If the word has multiple meanings, provide the most common/useful meaning.
   - Format: Plain text in Thai

2. **Usage Examples** (ตัวอย่างการใช้งาน): Provide 2-3 example sentences showing how to use this word.
   - Each example should be practical and easy to understand.
   - Format: Array of objects with:
     - "sentence": The example sentence in English
     - "translation": The Thai translation of the sentence

3. **Synonyms** (คำพ้องความหมาย): Provide 2-3 synonyms (words with similar meaning).
   - Format: Array of strings

4. **Antonyms** (คำตรงข้าม): Provide 1-2 antonyms (words with opposite meaning) if applicable.
   - If there are no clear antonyms, return an empty array.
   - Format: Array of strings

5. **Word Form Variations** (รูปคำที่เกี่ยวข้อง): Provide related word forms (noun, verb, adjective, adverb, etc.)
   - For example, if the word is "happy", provide: happiness (noun), happily (adverb)
   - Format: Array of objects with:
     - "form": The word form (e.g., "noun", "verb", "adjective", "adverb")
     - "word": The actual word

6. **Common Phrases** (วลีที่ใช้บ่อย): Provide 1-2 common phrases or idioms that use this word.
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
}
`;

