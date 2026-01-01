import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not set in environment variables' },
                { status: 500 }
            );
        }

        // Call Google Gemini API directly to list models
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to fetch models');
        }

        const data = await response.json();

        // Filter models that support generateContent
        interface ModelResponse {
            name?: string;
            displayName?: string;
            description?: string;
            supportedGenerationMethods?: string[];
            inputTokenLimit?: string;
            outputTokenLimit?: string;
            version?: string;
        }

        const availableModels = ((data.models || []) as ModelResponse[])
            .filter((model) => {
                // Check if model supports generateContent method
                return model.supportedGenerationMethods?.includes('generateContent');
            })
            .map((model) => ({
                name: model.name?.replace('models/', '') || model.name,
                fullName: model.name,
                displayName: model.displayName,
                description: model.description,
                supportedMethods: model.supportedGenerationMethods || [],
                inputTokenLimit: model.inputTokenLimit,
                outputTokenLimit: model.outputTokenLimit,
                version: model.version,
            }));

        return NextResponse.json({
            total: availableModels.length,
            models: availableModels,
        });
    } catch (error) {
        console.error('Error listing models:', error);
        return NextResponse.json(
            {
                error: 'Failed to list models',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

