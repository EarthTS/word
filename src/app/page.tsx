'use client';

import React from 'react';
import { Card, Button, Typography, Row, Col, Space } from 'antd';
import { useRouter } from 'next/navigation';
import { BookOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Home() {
  const router = useRouter();

  return (
    <div style={{ padding: '16px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px', marginTop: '32px' }}>
          <Title level={1} style={{ color: '#1890ff', marginBottom: '16px' }}>
            📚 Vocabulary Learning
          </Title>
          <Text style={{ fontSize: '18px', color: '#666' }}>
            แอปเรียนคำศัพท์ภาษาอังกฤษ
          </Text>
        </div>

        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={12} md={10}>
            <Card
              hoverable
              style={{
                textAlign: 'center',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid #e8e8e8',
                height: '280px'
              }}
              styles={{ body: { padding: '32px' } }}
            >
              <div style={{ marginBottom: '24px' }}>
                <BookOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </div>
              <Title level={3} style={{ marginBottom: '16px', color: '#333' }}>
                เรียนตามบท
              </Title>
              <Text style={{ 
                fontSize: '16px', 
                color: '#666',
                display: 'block',
                marginBottom: '24px'
              }}>
                เลือกเรียนคำศัพท์ตามบท<br/>
                (100 บท บทละ 30 คำ)
              </Text>
              <Button 
                type="primary" 
                size="large"
                onClick={() => router.push('/story')}
                style={{ 
                  borderRadius: '8px',
                  height: '44px',
                  fontSize: '16px',
                  minWidth: '140px'
                }}
              >
                เริ่มเรียน
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={10}>
            <Card
              hoverable
              style={{
                textAlign: 'center',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid #e8e8e8',
                height: '280px'
              }}
              styles={{ body: { padding: '32px' } }}
            >
              <div style={{ marginBottom: '24px' }}>
                <QuestionCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
              </div>
              <Title level={3} style={{ marginBottom: '16px', color: '#333' }}>
                ทดสอบความรู้
              </Title>
              <Text style={{ 
                fontSize: '16px', 
                color: '#666',
                display: 'block',
                marginBottom: '24px'
              }}>
                ทดสอบคำศัพท์แบบ Quiz<br/>
                (4 ตัวเลือก)
              </Text>
              <Button 
                type="primary" 
                size="large"
                onClick={() => router.push('/quiz')}
                style={{ 
                  borderRadius: '8px',
                  height: '44px',
                  fontSize: '16px',
                  minWidth: '140px',
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a'
                }}
              >
                เริ่มทดสอบ
              </Button>
            </Card>
          </Col>
        </Row>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Space direction="vertical" size="small">
            <Text type="secondary" style={{ fontSize: '14px' }}>
              📊 รวมคำศัพท์ทั้งหมด 3,000 คำ
            </Text>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              🎯 เรียนรู้และทดสอบความรู้ได้อย่างสะดวก
            </Text>
          </Space>
        </div>
      </div>
    </div>
  );
}
