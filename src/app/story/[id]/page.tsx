'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Typography, Progress, Space, Row, Col, message } from 'antd';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import vocabularyData from '../../../assets/vocabulary.json';

const { Title, Text } = Typography;

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
  const [isRetryRound, setIsRetryRound] = useState(false);
  const [currentRoundQuestions, setCurrentRoundQuestions] = useState<QuizQuestion[]>([]);

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
        .filter((w: any) => w.thai_meaning !== word.thai_meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w: any) => w.thai_meaning);

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
      const retryQuestions = wrongQuestions.map(index => quizQuestions[index]);
      setCurrentRoundQuestions(retryQuestions);
    }
  }, [quizQuestions, isRetryRound, wrongQuestions]);

  useEffect(() => {
    setAnsweredQuestions(new Array(currentRoundQuestions.length).fill(false));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
  }, [currentRoundQuestions]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentRoundQuestions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setScore((prev: any) => prev + 1);
      message.success('ถูกต้อง!');
    } else {
      message.error(`ผิด! คำตอบที่ถูกคือ: ${currentRoundQuestions[currentQuestionIndex].correctAnswer}`);
      // Track wrong questions for retry (using original quiz index if in retry mode)
      if (!isRetryRound) {
        const originalIndex = quizQuestions.findIndex(q => q.word.english === currentRoundQuestions[currentQuestionIndex].word.english);
        setWrongQuestions((prev: any) => [...prev, originalIndex]);
      } else {
        // Still wrong in retry round, keep it for next retry
        const originalIndex = wrongQuestions[currentQuestionIndex];
        if (!wrongQuestions.includes(originalIndex)) {
          setWrongQuestions((prev: any) => [...prev, originalIndex]);
        }
      }
    }

    setAnsweredQuestions((prev: any) => {
      const newAnswered = [...prev];
      newAnswered[currentQuestionIndex] = true;
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
    if (currentQuestionIndex < currentRoundQuestions.length - 1) {
      setCurrentQuestionIndex((prev: any) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Round completed
      const currentCorrect = selectedAnswer === currentRoundQuestions[currentQuestionIndex].correctAnswer;
      const finalScore = score + (currentCorrect ? 1 : 0);
      
      if (wrongQuestions.length > 0 && !isRetryRound) {
        // Start retry round with wrong questions
        message.info(`ทำซ้ำข้อที่ผิด (${wrongQuestions.length} ข้อ)`);
        setIsRetryRound(true);
        setScore(0); // Reset score for retry round
        setWrongQuestions([]); // Will track new wrong questions in retry
      } else if (wrongQuestions.length > 0 && isRetryRound) {
        // Still have wrong answers in retry round, continue retrying
        message.info(`ทำซ้ำข้อที่ยังผิด (${wrongQuestions.length} ข้อ)`);
        setScore(0);
        const newWrongQuestions = [...wrongQuestions];
        setWrongQuestions([]);
        setTimeout(() => setWrongQuestions(newWrongQuestions), 100);
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

  const currentQuestion = currentRoundQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / currentRoundQuestions.length) * 100;

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
            ข้อที่ {currentQuestionIndex + 1} จาก {currentRoundQuestions.length}
            {isRetryRound && <span style={{ color: '#ff4d4f', marginLeft: '8px' }}>(ทำซ้ำข้อที่ผิด)</span>}
          </Text>
        </div>

        {/* Question Card */}
        <Card 
          style={{ 
            marginBottom: '24px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
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
              onClick={handleNextQuestion}
              style={{ minWidth: '200px', borderRadius: '8px' }}
            >
              {currentQuestionIndex < currentRoundQuestions.length - 1 ? 'ข้อถัดไป' : 
               (wrongQuestions.length > 0 ? 'ไปข้อต่อไป' : 'จบแบบทดสอบ')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
