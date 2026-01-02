import { NextRequest, NextResponse } from 'next/server';
import { VocabularyAIService } from '@/lib/services/vocabulary-ai.service';
import { vocabularyCache } from '@/lib/cache/vocabulary-cache';

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

        // Normalize word for cache key (lowercase, trim)
        const cacheKey = `vocabulary:${word.toLowerCase().trim()}`;

        // Check cache first
        const cachedResult = vocabularyCache.get(cacheKey);
        if (cachedResult) {
            console.log(`Cache hit for word: ${word}`);
            return NextResponse.json({
                ...cachedResult,
                _cached: true,
            });
        }

        console.log(`Cache miss for word: ${word}, fetching from AI...`);

        // Cache miss, fetch from AI
        const vocabularyAIService = new VocabularyAIService();
        const result = await vocabularyAIService.getWordDetails(word);

        // Store in cache (24 hours TTL)
        vocabularyCache.set(cacheKey, result, 24 * 60 * 60 * 1000);

        return NextResponse.json({
            ...result,
            _cached: false,
        });
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

