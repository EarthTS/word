'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Button, Space, Spin, message, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ModelInfo {
  name: string;
  fullName?: string;
  displayName?: string;
  description?: string;
  supportedMethods?: string[];
  inputTokenLimit?: string;
  outputTokenLimit?: string;
  version?: string;
}

export default function ModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vocabulary/models');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch models');
      }

      const data = await response.json();
      setModels(data.models || []);
      setTotal(data.total || 0);
      message.success(`พบ ${data.total} models ที่รองรับ generateContent`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const columns = [
    {
      title: 'Model Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ModelInfo) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>
            {text}
          </Text>
          {record.fullName && record.fullName !== text && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.fullName}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Display Name',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text: string) => text || '-',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (text: string) => text || '-',
    },
    {
      title: 'Input Token Limit',
      dataIndex: 'inputTokenLimit',
      key: 'inputTokenLimit',
      render: (text: string) => text ? parseInt(text).toLocaleString() : '-',
    },
    {
      title: 'Output Token Limit',
      dataIndex: 'outputTokenLimit',
      key: 'outputTokenLimit',
      render: (text: string) => text ? parseInt(text).toLocaleString() : '-',
    },
    {
      title: 'Supported Methods',
      dataIndex: 'supportedMethods',
      key: 'supportedMethods',
      render: (methods: string[]) => (
        <Space wrap>
          {methods?.map((method, index) => (
            <Tag key={index} color="blue">
              {method}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {text || '-'}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ marginBottom: '8px', margin: 0 }}>
              📋 Available Models
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchModels}
              loading={loading}
            >
              รีเฟรช
            </Button>
          </div>
          <Text type="secondary">
            รายการ models ที่รองรับ generateContent method
          </Text>
        </div>

        {/* Summary Card */}
        <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
          <Space>
            <Text strong>Total Models:</Text>
            <Text style={{ fontSize: '18px', color: '#1890ff' }}>{total}</Text>
          </Space>
        </Card>

        {/* Models Table */}
        <Card style={{ borderRadius: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>
                <Text>กำลังโหลดข้อมูล...</Text>
              </div>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={models}
              rowKey="name"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `ทั้งหมด ${total} models`,
              }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Card>
      </div>
    </div>
    );
}

