import { useState, useEffect } from 'react';
import { Table, Button, Card, Modal, Form, Input, Select, Tag, Space, message } from 'antd';
import { PlusOutlined, ApartmentOutlined, PlayCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

interface PipelineItem {
  id: string;
  name: string;
  description?: string;
  isPreset: boolean;
  cronExpression?: string;
  createdAt: string;
}

export default function Pipelines() {
  const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchPipelines = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/pipelines');
      setPipelines(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPipelines(); }, []);

  const handleCreate = async (values: any) => {
    try {
      await axios.post('/api/pipelines', {
        ...values,
        template: JSON.stringify({ nodes: [], edges: [] }),
      });
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchPipelines();
    } catch (e: any) {
      message.error('创建失败');
    }
  };

  const handleRun = async (id: string) => {
    try {
      await axios.post(`/api/pipelines/${id}/run`);
      message.success('流水线已启动');
    } catch (e: any) {
      message.error('启动失败');
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '类型', key: 'type',
      render: (_: any, r: PipelineItem) => r.isPreset
        ? <Tag color="blue">预置模板</Tag>
        : <Tag>自定义</Tag>
    },
    { title: '定时', dataIndex: 'cronExpression', key: 'cronExpression', render: (v: string) => v || '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
    {
      title: '操作', key: 'action',
      render: (_: any, record: PipelineItem) => (
        <Space>
          <Button size="small" icon={<PlayCircleOutlined />} onClick={() => handleRun(record.id)}>运行</Button>
          <Button size="small">编辑</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title={<><ApartmentOutlined /> 流水线编排</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建流水线</Button>}
      >
        <Table columns={columns} dataSource={pipelines} rowKey="id" loading={loading} />
      </Card>

      <Modal title="新建流水线" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="如: 每日回归评测" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="cronExpression" label="定时执行(Cron表达式)">
            <Input placeholder="如: 0 2 * * * (每天凌晨2点)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
