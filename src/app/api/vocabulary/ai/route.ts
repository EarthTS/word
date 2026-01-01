import { NextRequest, NextResponse } from 'next/server';
import { VocabularyAIService } from '@/lib/services/vocabulary-ai.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { word } = body;

        if (!word || typeof word !== 'string') {
            return NextResponse.json(
                { error: 'Word parameter is required and must be a string' },
                { status: 400 }
            );
        }

        const vocabularyAIService = new VocabularyAIService();
        const result = await vocabularyAIService.getWordDetails(word);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in vocabulary AI API:', error);
        return NextResponse.json(
            {
                error: 'Failed to get word details',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

