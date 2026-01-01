'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Typography, Progress, Space, Row, Col, message, Modal, Spin, Divider, Tag } from 'antd';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { VocabularyAIResult } from '@/lib/services/vocabulary-ai.service';
import vocabularyData from '../../../assets/vocabulary.json';

const { Title, Text, Paragraph } = Typography;

interface VocabularyItem {
  english: string;
  thai_pronunciation: string;
  thai_meaning: string;
  type: string;
}

interface QuizQuestion {
  word: VocabularyItem;
  choices: string[];
  correctAnswer: string;
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const chapterId = parseInt(params.id as string);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<number[]>([]);
  const [roundWrongQuestions, setRoundWrongQuestions] = useState<number[]>([]);
  const [isRetryRound, setIsRetryRound] = useState(false);
  const [currentRoundQuestions, setCurrentRoundQuestions] = useState<QuizQuestion[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [aiResult, setAiResult] = useState<VocabularyAIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentWord, setCurrentWord] = useState<string>('');

  // Get words for the current chapter
  const chapterWords = useMemo(() => {
    const wordsPerChapter = 30;
    const startIndex = (chapterId - 1) * wordsPerChapter;
    const endIndex = startIndex + wordsPerChapter;
    
    if (startIndex >= vocabularyData.vocabulary.length) {
      return [];
    }
    
    return vocabularyData.vocabulary.slice(startIndex, endIndex);
  }, [chapterId]);

  // Generate quiz questions
  const quizQuestions = useMemo(() => {
    if (chapterWords.length === 0) return [];

    // Shuffle the words for random order
    const shuffledWords = [...chapterWords].sort(() => Math.random() - 0.5);
    
    return shuffledWords.map((word): QuizQuestion => {
      // Get 3 random wrong answers from the same chapter
      const wrongAnswers = chapterWords
        .filter((w: VocabularyItem) => w.thai_meaning !== word.thai_meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w: VocabularyItem) => w.thai_meaning);

      // Create choices array with correct answer and wrong answers
      const choices = [word.thai_meaning, ...wrongAnswers].sort(() => Math.random() - 0.5);

      return {
        word,
        choices,
        correctAnswer: word.thai_meaning
      };
    });
  }, [chapterWords]);

  // Set up current round questions
  useEffect(() => {
    if (!isRetryRound) {
      setCurrentRoundQuestions(quizQuestions);
    } else {
      // Get only wrong questions for retry
      const retryQuestions = wrongQuestions
        .map(index => quizQuestions[index])
        .filter((q): q is QuizQuestion => q !== undefined);
      setCurrentRoundQuestions(retryQuestions);
    }
  }, [quizQuestions, isRetryRound, wrongQuestions]);

  useEffect(() => {
    if (currentRoundQuestions.length > 0) {
      setAnsweredQuestions(new Array(currentRoundQuestions.length).fill(false));
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setRoundWrongQuestions([]);
    }
  }, [currentRoundQuestions]);

  const handleAnswerSelect = (answer: string) => {
    const safeIndex = Math.min(currentQuestionIndex, currentRoundQuestions.length - 1);
    if (safeIndex < 0 || safeIndex >= currentRoundQuestions.length) {
      return;
    }

    setSelectedAnswer(answer);
    setShowResult(true);

    const currentQuestion = currentRoundQuestions[safeIndex];
    if (!currentQuestion) {
      return;
    }

    const isCorrect = answer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      message.success('ถูกต้อง!');
    } else {
      message.error(`ผิด! คำตอบที่ถูกคือ: ${currentQuestion.correctAnswer}`);
      // Track wrong questions for the current round (using original quiz index)
      let originalIndex: number;
      if (isRetryRound) {
        // In retry round, get the original index from wrongQuestions array
        originalIndex = wrongQuestions[safeIndex] ?? -1;
      } else {
        // In first round, find the index in quizQuestions
        originalIndex = quizQuestions.findIndex(q => q.word.english === currentQuestion.word.english);
      }

      if (originalIndex >= 0) {
        setRoundWrongQuestions(prev => (prev.includes(originalIndex) ? prev : [...prev, originalIndex]));
      }
    }

    setAnsweredQuestions(prev => {
      const newAnswered = [...prev];
      newAnswered[safeIndex] = true;
      return newAnswered;
    });
  };

  // Cookie functions
  const getCompletedChapters = () => {
    if (typeof document !== 'undefined') {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('completed_chapters='));
      return cookie ? JSON.parse(cookie.split('=')[1]) : [];
    }
    return [];
  };

  const saveCompletedChapter = (chapterNumber: number) => {
    if (typeof document !== 'undefined') {
      const completed = getCompletedChapters();
      if (!completed.includes(chapterNumber)) {
        completed.push(chapterNumber);
        document.cookie = `completed_chapters=${JSON.stringify(completed)}; path=/; max-age=31536000`; // 1 year
      }
    }
  };

  const handleNextQuestion = () => {
    const safeIndex = Math.min(currentQuestionIndex, currentRoundQuestions.length - 1);
    if (safeIndex < currentRoundQuestions.length - 1) {
      setCurrentQuestionIndex(prev => Math.min(prev + 1, currentRoundQuestions.length - 1));
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Round completed
      const hasWrongThisRound = roundWrongQuestions.length > 0;
      // Filter out invalid indices
      const validWrongIndices = roundWrongQuestions.filter(idx => idx >= 0 && idx < quizQuestions.length);

      if (validWrongIndices.length > 0 && !isRetryRound) {
        // Start retry round with wrong questions from this round
        message.info(`ทำซ้ำข้อที่ผิด (${validWrongIndices.length} ข้อ)`);
        setIsRetryRound(true);
        setScore(0); // Reset score for retry round
        setWrongQuestions(validWrongIndices);
        setRoundWrongQuestions([]);
      } else if (validWrongIndices.length > 0 && isRetryRound) {
        // Still have wrong answers in retry round, continue retrying
        message.info(`ทำซ้ำข้อที่ยังผิด (${validWrongIndices.length} ข้อ)`);
        setScore(0);
        setWrongQuestions(validWrongIndices);
        setRoundWrongQuestions([]);
      } else {
        // All correct! Chapter completed
        message.success('ยินดีด้วย! ผ่านบทนี้แล้ว 🎉');
        saveCompletedChapter(chapterId);
        setTimeout(() => router.push('/story'), 1500);
      }
    }
  };

  const handleBackToChapters = () => {
    router.push('/story');
  };

  const handleInfoClick = async (word: string) => {
    setCurrentWord(word);
    setIsModalVisible(true);
    setAiLoading(true);
    setAiResult(null);

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
      setAiResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      message.error(errorMessage);
      setAiResult(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setAiResult(null);
    setCurrentWord('');
  };

  if (chapterWords.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <Title level={3}>ไม่พบข้อมูลบทนี้</Title>
        <Button onClick={handleBackToChapters}>กลับไปเลือกบท</Button>
      </div>
    );
  }

  if (currentRoundQuestions.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <Title level={3}>กำลังโหลด...</Title>
      </div>
    );
  }

  // Ensure currentQuestionIndex is within bounds
  const safeQuestionIndex = Math.min(currentQuestionIndex, currentRoundQuestions.length - 1);
  const currentQuestion = currentRoundQuestions[safeQuestionIndex];
  
  // Safety check: if currentQuestion is undefined, show loading
  if (!currentQuestion || !currentQuestion.word) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <Title level={3}>กำลังโหลด...</Title>
      </div>
    );
  }

  const progress = ((safeQuestionIndex + 1) / currentRoundQuestions.length) * 100;

  return (
    <div style={{ padding: '16px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={handleBackToChapters}
                type="text"
              >
                กลับ
              </Button>
            </Col>
            <Col>
              <Text strong style={{ fontSize: '16px' }}>
                บทที่ {chapterId}
              </Text>
            </Col>
            <Col>
              <Text type="secondary">
                {score}/{answeredQuestions.filter(a => a).length}
              </Text>
            </Col>
          </Row>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '24px' }}>
          <Progress 
            percent={progress} 
            showInfo={false} 
            strokeColor="#1890ff"
            style={{ marginBottom: '8px' }}
          />
          <Text type="secondary" style={{ fontSize: '14px' }}>
            ข้อที่ {safeQuestionIndex + 1} จาก {currentRoundQuestions.length}
            {isRetryRound && <span style={{ color: '#ff4d4f', marginLeft: '8px' }}>(ทำซ้ำข้อที่ผิด)</span>}
          </Text>
        </div>

        {/* Question Card */}
        <Card 
          style={{ 
            marginBottom: '24px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            position: 'relative'
          }}
        >
          {showResult && (
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => handleInfoClick(currentQuestion.word.english)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: '#1890ff',
                fontSize: '18px'
              }}
            />
          )}
          <Title level={2} style={{ marginBottom: '16px', color: '#1890ff' }}>
            {currentQuestion.word.english}
          </Title>
          <Text style={{ fontSize: '16px', color: '#666' }}>
            [{currentQuestion.word.thai_pronunciation}]
          </Text>
          <div style={{ marginTop: '16px' }}>
            <Text style={{ fontSize: '14px', color: '#999' }}>
              {currentQuestion.word.type}
            </Text>
          </div>
        </Card>

        {/* Choices */}
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {currentQuestion.choices.map((choice, index) => {
            const isSelected = selectedAnswer === choice;
            const isCorrect = choice === currentQuestion.correctAnswer;
            let buttonType: 'default' | 'primary' | undefined = 'default';
            let buttonStyle: React.CSSProperties = {
              height: 'auto',
              padding: '16px 20px',
              borderRadius: '12px',
              fontSize: '16px',
              textAlign: 'left' as const,
              whiteSpace: 'normal' as const,
              wordBreak: 'break-word' as const
            };

            if (showResult) {
              if (isCorrect) {
                buttonType = 'primary';
                buttonStyle = {
                  ...buttonStyle,
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a',
                  color: 'white'
                };
              } else if (isSelected && !isCorrect) {
                buttonStyle = {
                  ...buttonStyle,
                  backgroundColor: '#ff4d4f',
                  borderColor: '#ff4d4f',
                  color: 'white'
                };
              }
            }

            return (
              <Button
                key={index}
                block
                size="large"
                type={buttonType}
                style={buttonStyle}
                onClick={() => !showResult && handleAnswerSelect(choice)}
                disabled={showResult}
                icon={showResult && isCorrect ? <CheckCircleOutlined /> : 
                      showResult && isSelected && !isCorrect ? <CloseCircleOutlined /> : null}
              >
                {choice}
              </Button>
            );
          })}
        </Space>

        {/* Next Button */}
        {showResult && (
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <Button 
              type="primary" 
              size="large" 
              className='w-full'
              onClick={handleNextQuestion}
              style={{ minWidth: '200px', borderRadius: '8px' }}
            >
              {safeQuestionIndex < currentRoundQuestions.length - 1 ? 'ข้อถัดไป' : 
               (roundWrongQuestions.length > 0 ? 'ทำซ้ำข้อที่ผิด' : 'จบแบบทดสอบ')}
            </Button>
          </div>
        )}

        {/* AI Info Modal */}
        <Modal
          title={
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              🤖 AI Vocabulary Helper
            </Title>
          }
          open={isModalVisible}
          onCancel={handleModalClose}
          footer={[
            <Button key="close" onClick={handleModalClose}>
              ปิด
            </Button>
          ]}
          width={800}
          style={{ top: 20 }}
        >
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>
                <Text>กำลังค้นหาข้อมูล...</Text>
              </div>
            </div>
          ) : aiResult ? (
            <div>
              <Title level={3} style={{ marginBottom: '16px', color: '#1890ff' }}>
                {currentWord} {aiResult.type && <span style={{ fontSize: '20px', color: '#999', fontWeight: 'normal' }}>({aiResult.type})</span>}
              </Title>
              
              {/* Meaning */}
              <div style={{ marginBottom: '24px' }}>
                <Title level={5} style={{ marginBottom: '8px' }}>
                  ความหมาย
                </Title>
                <Text style={{ fontSize: '16px' }}>
                  {aiResult.meaning}
                </Text>
              </div>

              <Divider />

              {/* Usage Examples */}
              {aiResult.usageExamples.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '16px' }}>
                    ตัวอย่างการใช้งาน
                  </Title>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {aiResult.usageExamples.map((example, index) => (
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
              {aiResult.synonyms.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '12px' }}>
                    คำพ้องความหมาย
                  </Title>
                  <Space wrap>
                    {aiResult.synonyms.map((synonym, index) => (
                      <Tag key={index} color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {synonym}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              {/* Antonyms */}
              {aiResult.antonyms.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '12px' }}>
                    คำตรงข้าม
                  </Title>
                  <Space wrap>
                    {aiResult.antonyms.map((antonym, index) => (
                      <Tag key={index} color="red" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {antonym}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              {/* Word Form Variations */}
              {aiResult.wordFormVariations.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '12px' }}>
                    รูปคำที่เกี่ยวข้อง
                  </Title>
                  <Space wrap>
                    {aiResult.wordFormVariations.map((variation, index) => (
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
              {aiResult.commonPhrases.length > 0 && (
                <div>
                  <Title level={5} style={{ marginBottom: '16px' }}>
                    วลีที่ใช้บ่อย
                  </Title>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {aiResult.commonPhrases.map((phrase, index) => (
                      <Card 
                        key={index}
                        size="small"
                        style={{ backgroundColor: '#fff7e6' }}
                      >
                        <Text strong style={{ display: 'block', marginBottom: '8px', color: '#d46b08' }}>
                          {phrase.phrase}
                        </Text>
                        <Text>{phrase.meaning}</Text>
                      </Card>
                    ))}
                  </Space>
                </div>
              )}
            </div>
          ) : null}
        </Modal>
      </div>
    </div>
  );
}
