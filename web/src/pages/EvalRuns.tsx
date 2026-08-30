import { useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Space, Progress, Select, message } from 'antd';
import { PlayCircleOutlined, ExperimentOutlined } from '@ant-design/icons';
import axios from 'axios';

interface EvalRunItem {
  id: string;
  skillId: string;
  endpointId: string;
  status: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  createdAt: string;
}

export default function EvalRuns() {
  const [evalRuns, setEvalRuns] = useState<EvalRunItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedDataset, setSelectedDataset] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [runsRes, agentsRes, datasetsRes] = await Promise.all([
        axios.get('/api/eval-runs'),
        axios.get('/api/agents'),
        axios.get('/api/datasets'),
      ]);
      setEvalRuns(runsRes.data);
      setAgents(agentsRes.data);
      setDatasets(datasetsRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleStartEval = async () => {
    if (!selectedAgent) { message.warning('请选择智能体'); return; }
    try {
      await axios.post('/api/eval-runs', {
        skillId: selectedAgent,
        endpointId: selectedAgent,
        datasetId: selectedDataset || undefined,
      });
      message.success('评测已启动');
      fetchData();
    } catch (e: any) {
      message.error('启动失败');
    }
  };

  const statusColor: Record<string, string> = {
    pending: 'default', running: 'processing', completed: 'success', failed: 'error'
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100, ellipsis: true },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => <Tag color={statusColor[v] || 'default'}>{v}</Tag>
    },
    {
      title: '进度', key: 'progress',
      render: (_: any, r: EvalRunItem) => {
        const total = r.totalCases || 1;
        const done = r.passedCases + r.failedCases;
        return <Progress percent={Math.round((done / total) * 100)} size="small" />;
      }
    },
    { title: '总用例', dataIndex: 'totalCases', key: 'totalCases' },
    { title: '通过', dataIndex: 'passedCases', key: 'passedCases', render: (v: number) => <span style={{ color: '#52c41a' }}>{v}</span> },
    { title: '失败', dataIndex: 'failedCases', key: 'failedCases', render: (v: number) => <span style={{ color: '#ff4d4f' }}>{v}</span> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
    {
      title: '操作', key: 'action',
      render: (_: any, record: EvalRunItem) => (
        <Space>
          <Button size="small">详情</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title={<><ExperimentOutlined /> 评测执行</>}
        extra={
          <Space>
            <Select placeholder="选择智能体" style={{ width: 160 }} value={selectedAgent || undefined} onChange={setSelectedAgent}
              options={agents.map(a => ({ value: a.id, label: a.name }))} />
            <Select placeholder="选择数据集(可选)" style={{ width: 180 }} value={selectedDataset || undefined} onChange={setSelectedDataset} allowClear
              options={datasets.map(d => ({ value: d.id, label: d.name }))} />
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartEval}>开始评测</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={evalRuns} rowKey="id" loading={loading} />
      </Card>
    </div>
  );
}
