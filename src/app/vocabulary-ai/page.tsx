'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Typography, Space, Spin, message, Divider, Tag } from 'antd';
import { SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { VocabularyAIResult } from '@/lib/services/vocabulary-ai.service';

const { Title, Text, Paragraph } = Typography;

export default function VocabularyAIPage() {
  const router = useRouter();
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VocabularyAIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!word.trim()) {
      message.warning('กรุณากรอกคำศัพท์');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/vocabulary/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: word.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch word details');
      }

      const data = await response.json();
      setResult(data);
      message.success('โหลดข้อมูลสำเร็จ!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  return (
    <div style={{ padding: '16px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/')}
            type="text"
            style={{ marginBottom: '16px' }}
          >
            กลับหน้าหลัก
          </Button>
          <Title level={2} style={{ marginBottom: '8px' }}>
            🤖 AI Vocabulary Helper
          </Title>
        </div>

        {/* Search Input */}
        <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              size="large"
              placeholder="กรอกคำศัพท์ภาษาอังกฤษ..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={{ borderRadius: '8px 0 0 8px' }}
            />
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
              style={{ borderRadius: '0 8px 8px 0' }}
            >
              ค้นหา
            </Button>
          </Space.Compact>
        </Card>

        {/* Loading */}
        {loading && (
          <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>กำลังค้นหาข้อมูล...</Text>
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card style={{ borderRadius: '12px', borderColor: '#ff4d4f' }}>
            <Text type="danger">{error}</Text>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div>
            <Card 
              style={{ 
                marginBottom: '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <Title level={3} style={{ marginBottom: '16px', color: '#1890ff' }}>
                {word} {result.type && <span style={{ fontSize: '20px', color: '#999', fontWeight: 'normal' }}>({result.type})</span>}
              </Title>
              
              {/* Meaning */}
              <div style={{ marginBottom: '24px' }}>
                <Title level={5} style={{ marginBottom: '8px' }}>
                  ความหมาย
                </Title>
                <Paragraph style={{ fontSize: '16px', margin: 0 }}>
                  {result.meaning}
                </Paragraph>
              </div>

              <Divider />

              {/* Usage Examples */}
              {result.usageExamples.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '16px' }}>
                    ตัวอย่างการใช้งาน
                  </Title>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {result.usageExamples.map((example, index) => (
                      <Card 
                        key={index}
                        size="small"
                        style={{ backgroundColor: '#f9f9f9' }}
                      >
                        <Paragraph strong style={{ marginBottom: '8px' }}>
                          {example.sentence}
                        </Paragraph>
                        <Text type="secondary">{example.translation}</Text>
                      </Card>
                    ))}
                  </Space>
                </div>
              )}

              {/* Synonyms */}
              {result.synonyms.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '12px' }}>
                    คำพ้องความหมาย
                  </Title>
                  <Space wrap>
                    {result.synonyms.map((synonym, index) => (
                      <Tag key={index} color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {synonym}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              {/* Antonyms */}
              {result.antonyms.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '12px' }}>
                    คำตรงข้าม
                  </Title>
                  <Space wrap>
                    {result.antonyms.map((antonym, index) => (
                      <Tag key={index} color="red" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {antonym}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              {/* Word Form Variations */}
              {result.wordFormVariations.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '12px' }}>
                    รูปคำที่เกี่ยวข้อง
                  </Title>
                  <Space wrap>
                    {result.wordFormVariations.map((variation, index) => (
                      <Tag key={index} color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        <Text strong>{variation.word}</Text>
                        <Text type="secondary" style={{ marginLeft: '4px' }}>
                          ({variation.form})
                        </Text>
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              {/* Common Phrases */}
              {result.commonPhrases.length > 0 && (
                <div>
                  <Title level={5} style={{ marginBottom: '16px' }}>
                    วลีที่ใช้บ่อย
                  </Title>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {result.commonPhrases.map((phrase, index) => (
                      <Card 
                        key={index}
                        size="small"
                        style={{ backgroundColor: '#fff7e6' }}
                      >
                        <Paragraph strong style={{ marginBottom: '8px', color: '#d46b08' }}>
                          {phrase.phrase}
                        </Paragraph>
                        <Text>{phrase.meaning}</Text>
                      </Card>
                    ))}
                  </Space>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

