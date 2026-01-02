import { NextRequest, NextResponse } from 'next/server';
import { vocabularyCache } from '@/lib/cache/vocabulary-cache';

export async function GET() {
    try {
        const stats = vocabularyCache.getStats();
        return NextResponse.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('Error getting cache stats:', error);
        return NextResponse.json(
            {
                error: 'Failed to get cache stats',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const word = searchParams.get('word');

        if (word) {
            // Delete specific word from cache
            const cacheKey = `vocabulary:${word.toLowerCase().trim()}`;
            vocabularyCache.delete(cacheKey);
            return NextResponse.json({
                success: true,
                message: `Cache for word "${word}" has been cleared`,
            });
        } else {
            // Clear all cache
            vocabularyCache.clear();
            return NextResponse.json({
                success: true,
                message: 'All cache has been cleared',
            });
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
        return NextResponse.json(
            {
                error: 'Failed to clear cache',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

