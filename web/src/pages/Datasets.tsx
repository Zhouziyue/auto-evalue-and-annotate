import { useState, useEffect } from 'react';
import { Table, Button, Card, Modal, Form, Input, Upload, Space, Tag, message, Tabs } from 'antd';
import { PlusOutlined, DatabaseOutlined, UploadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import axios from 'axios';

interface Dataset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  testCases?: any[];
  createdAt: string;
}

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
  const [form] = Form.useForm();
  const [genForm] = Form.useForm();

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/datasets');
      setDatasets(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDatasets(); }, []);

  const handleCreate = async (values: any) => {
    try {
      await axios.post('/api/datasets', values);
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchDatasets();
    } catch (e: any) {
      message.error('创建失败');
    }
  };

  const handleGenerate = async (values: any) => {
    try {
      const res = await axios.post('/api/datasets/generate', {
        datasetId: currentDataset?.id,
        input: values.input,
        count: 3,
      });
      message.success('AI生成完成！请查看候选答案');
      setGenModalOpen(false);
      genForm.resetFields();
    } catch (e: any) {
      message.error('生成失败');
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => v ? <Tag>{v}</Tag> : '-' },
    { title: '用例数', key: 'count', render: (_: any, r: Dataset) => r.testCases?.length || 0 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Dataset) => (
        <Space>
          <Button size="small" icon={<ThunderboltOutlined />} onClick={() => { setCurrentDataset(record); setGenModalOpen(true); }}>AI生成</Button>
          <Button size="small">详情</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title={<><DatabaseOutlined /> 评测数据集</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建数据集</Button>}
      >
        <Table columns={columns} dataSource={datasets} rowKey="id" loading={loading} />
      </Card>

      <Modal title="新建数据集" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="如: 客服对话评测集" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input placeholder="如: 对话、推理、代码" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="AI 生成评测用例" open={genModalOpen} onCancel={() => setGenModalOpen(false)} onOk={() => genForm.submit()} destroyOnClose>
        <Form form={genForm} layout="vertical" onFinish={handleGenerate}>
          <Form.Item name="input" label="输入问题/Prompt" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="输入一个问题，AI将生成3个候选标准答案" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
