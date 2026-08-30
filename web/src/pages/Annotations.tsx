import { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, Tabs, Rate, Input, message } from 'antd';
import { TagsOutlined, CheckCircleOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

interface AnnotationItem {
  id: string;
  evalResultId: string;
  type: string;
  annotatorId?: string;
  scores: string;
  comment?: string;
  isFinal: boolean;
  createdAt: string;
}

export default function Annotations() {
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnnotations = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/annotations');
      setAnnotations(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAnnotations(); }, []);

  const handleConfirm = async (id: string) => {
    try {
      await axios.post(`/api/annotations/${id}/confirm`);
      message.success('已确认标注');
      fetchAnnotations();
    } catch (e: any) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '评测结果ID', dataIndex: 'evalResultId', key: 'evalResultId', width: 120, ellipsis: true },
    {
      title: '类型', dataIndex: 'type', key: 'type',
      render: (v: string) => (
        <Tag color={v === 'ai' ? 'blue' : 'green'} icon={v === 'ai' ? <RobotOutlined /> : <UserOutlined />}>
          {v === 'ai' ? 'AI标注' : '人工标注'}
        </Tag>
      )
    },
    {
      title: '评分', dataIndex: 'scores', key: 'scores',
      render: (v: string) => {
        try {
          const s = JSON.parse(v);
          return <span>{Object.entries(s).map(([k, val]) => `${k}:${val}`).join(', ')}</span>;
        } catch { return v; }
      }
    },
    { title: '批注', dataIndex: 'comment', key: 'comment', ellipsis: true },
    {
      title: '状态', key: 'status',
      render: (_: any, r: AnnotationItem) => r.isFinal
        ? <Tag color="gold" icon={<CheckCircleOutlined />}>已确认</Tag>
        : <Tag>待复核</Tag>
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
    {
      title: '操作', key: 'action',
      render: (_: any, record: AnnotationItem) => !record.isFinal ? (
        <Button size="small" type="primary" onClick={() => handleConfirm(record.id)}>确认</Button>
      ) : null
    }
  ];

  return (
    <div>
      <Card title={<><TagsOutlined /> 标注管理</>}>
        <Tabs items={[
          { key: 'all', label: '全部标注', children: <Table columns={columns} dataSource={annotations} rowKey="id" loading={loading} /> },
          { key: 'pending', label: '待复核', children: <Table columns={columns} dataSource={annotations.filter(a => !a.isFinal)} rowKey="id" loading={loading} /> },
          { key: 'ai', label: 'AI标注', children: <Table columns={columns} dataSource={annotations.filter(a => a.type === 'ai')} rowKey="id" loading={loading} /> },
          { key: 'human', label: '人工标注', children: <Table columns={columns} dataSource={annotations.filter(a => a.type === 'human')} rowKey="id" loading={loading} /> },
        ]} />
      </Card>
    </div>
  );
}
