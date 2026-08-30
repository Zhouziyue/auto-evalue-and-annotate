import { useState, useEffect } from 'react';
import { Table, Button, Card, Modal, Form, Input, Select, Space, Tag, message } from 'antd';
import { PlusOutlined, ApiOutlined } from '@ant-design/icons';
import axios from 'axios';

interface Agent {
  id: string;
  name: string;
  url: string;
  authType: string;
  sseFormat: string;
  createdAt: string;
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/agents');
      setAgents(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleCreate = async (values: any) => {
    try {
      await axios.post('/api/agents', values);
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchAgents();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '创建失败');
    }
  };

  const handleTest = async (id: string) => {
    try {
      const res = await axios.post(`/api/agents/${id}/test`);
      message.success(`连接测试成功！延迟: ${res.data.latency}ms`);
    } catch (e: any) {
      message.error('连接测试失败');
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '地址', dataIndex: 'url', key: 'url', ellipsis: true },
    {
      title: '认证方式', dataIndex: 'authType', key: 'authType',
      render: (v: string) => <Tag color={v === 'none' ? 'default' : 'blue'}>{v}</Tag>
    },
    {
      title: 'SSE格式', dataIndex: 'sseFormat', key: 'sseFormat',
      render: (v: string) => <Tag>{v}</Tag>
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Agent) => (
        <Space>
          <Button size="small" onClick={() => handleTest(record.id)}>测试连接</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title={<><ApiOutlined /> 智能体管理</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>接入智能体</Button>}
      >
        <Table columns={columns} dataSource={agents} rowKey="id" loading={loading} />
      </Card>

      <Modal title="接入智能体" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="如: 客服Agent" />
          </Form.Item>
          <Form.Item name="url" label="接口地址" rules={[{ required: true }]}>
            <Input placeholder="https://api.example.com/agent/sse" />
          </Form.Item>
          <Form.Item name="authType" label="认证方式" initialValue="none">
            <Select options={[
              { value: 'none', label: '无认证' },
              { value: 'api_key', label: 'API Key' },
              { value: 'token', label: 'Bearer Token' },
            ]} />
          </Form.Item>
          <Form.Item name="sseFormat" label="SSE响应格式" initialValue="auto">
            <Select options={[
              { value: 'auto', label: '自动探测' },
              { value: 'content', label: 'content' },
              { value: 'delta', label: 'delta' },
              { value: 'openai', label: 'OpenAI格式' },
              { value: 'text', label: 'text' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
