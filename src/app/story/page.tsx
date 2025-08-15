'use client';

import React from 'react';
import { Card, Row, Col, Typography, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { BookOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function StoryPage() {
  const router = useRouter();

  // Calculate chapters (100 chapters, 30 words each from 3000 total words)
  const totalChapters = 100;
  const wordsPerChapter = 30;

  // Get completed chapters from cookie
  const getCompletedChapters = () => {
    if (typeof document !== 'undefined') {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('completed_chapters='));
      return cookie ? JSON.parse(cookie.split('=')[1]) : [];
    }
    return [];
  };

  const completedChapters = getCompletedChapters();

  const handleChapterClick = (chapterNumber: number) => {
    router.push(`/story/${chapterNumber}`);
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div style={{ padding: '16px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Back to Home Button */}
        <div style={{ marginBottom: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBackToHome}
            type="text"
            size="large"
            style={{ color: '#1890ff' }}
          >
            กลับหน้าหลัก
          </Button>
        </div>

        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px', color: '#1890ff' }}>
          <BookOutlined style={{ marginRight: '8px' }} />
          เลือกบท (Chapters)
        </Title>
        
        <Text style={{ display: 'block', textAlign: 'center', marginBottom: '32px', fontSize: '16px' }}>
          แต่ละบทมี {wordsPerChapter} คำศัพท์ เลือกบทที่ต้องการทดสอบ<br/>
          <span style={{ color: '#52c41a', fontSize: '14px' }}>
            ✅ บทที่ผ่านแล้วจะมีพื้นหลังสีเขียว
          </span>
        </Text>

        <Row gutter={[16, 16]}>
          {Array.from({ length: totalChapters }, (_, index) => {
            const chapterNumber = index + 1;
            const startWord = index * wordsPerChapter + 1;
            const endWord = (index + 1) * wordsPerChapter;

            const isCompleted = completedChapters.includes(chapterNumber);
            
            return (
              <Col xs={12} sm={8} md={6} lg={4} key={chapterNumber}>
                <Card
                  hoverable
                  style={{
                    textAlign: 'center',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: `2px solid ${isCompleted ? '#52c41a' : '#e8e8e8'}`,
                    backgroundColor: isCompleted ? '#f6ffed' : 'white'
                  }}
                  styles={{ body: { padding: '16px' } }}
                  onClick={() => handleChapterClick(chapterNumber)}
                >
                  <div style={{ marginBottom: '8px', position: 'relative' }}>
                    <BookOutlined style={{ fontSize: '24px', color: isCompleted ? '#52c41a' : '#1890ff' }} />
                    {isCompleted && (
                      <CheckCircleOutlined 
                        style={{ 
                          position: 'absolute', 
                          top: '-4px', 
                          right: '8px', 
                          fontSize: '16px', 
                          color: '#52c41a',
                          backgroundColor: 'white',
                          borderRadius: '50%'
                        }} 
                      />
                    )}
                  </div>
                  <Title level={4} style={{ margin: '8px 0', color: '#333' }}>
                    บทที่ {chapterNumber}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    คำที่ {startWord}-{endWord}
                  </Text>
                  <div style={{ marginTop: '12px' }}>
                    <Button 
                      type="primary" 
                      size="small" 
                      block
                      style={{
                        backgroundColor: isCompleted ? '#52c41a' : '#1890ff',
                        borderColor: isCompleted ? '#52c41a' : '#1890ff'
                      }}
                    >
                      {isCompleted ? 'ทำซ้ำ' : 'เริ่มทดสอบ'}
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
}
