import { useState, useEffect } from 'react';
import { Card, Button, Select, Space, Statistic, Row, Col, Divider, Spin, message, Empty } from 'antd';
import { BarChartOutlined, FileTextOutlined, RobotOutlined } from '@ant-design/icons';
import axios from 'axios';

export default function Reports() {
  const [evalRuns, setEvalRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<string>('');
  const [report, setReport] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    axios.get('/api/eval-runs').then(res => setEvalRuns(res.data)).catch(console.error);
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedRun) { message.warning('请选择评测记录'); return; }
    setLoading(true);
    try {
      const res = await axios.get(`/api/reports/${selectedRun}`);
      setReport(res.data);
    } catch (e: any) {
      message.error('生成报告失败');
    }
    setLoading(false);
  };

  const handleAiAnalysis = async () => {
    if (!selectedRun) return;
    setAnalyzing(true);
    try {
      const res = await axios.get(`/api/reports/${selectedRun}/ai-analysis`);
      setAiAnalysis(res.data.analysis || res.data.summary || '分析完成');
    } catch (e: any) {
      message.error('AI分析失败');
    }
    setAnalyzing(false);
  };

  return (
    <div>
      <Card
        title={<><FileTextOutlined /> 评测报告</>}
        extra={
          <Space>
            <Select placeholder="选择评测记录" style={{ width: 240 }} value={selectedRun || undefined} onChange={setSelectedRun}
              options={evalRuns.map((r: any) => ({ value: r.id, label: `${r.id.slice(0, 8)}... - ${r.status}` }))} />
            <Button onClick={handleGenerateReport} loading={loading}>生成报告</Button>
            <Button type="primary" icon={<RobotOutlined />} onClick={handleAiAnalysis} loading={analyzing}>AI智能分析</Button>
          </Space>
        }
      >
        {!report && !aiAnalysis && <Empty description="请选择评测记录并生成报告" />}

        {report && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}><Statistic title="总用例" value={report.totalCases || 0} /></Col>
              <Col span={6}><Statistic title="通过" value={report.passedCases || 0} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={6}><Statistic title="失败" value={report.failedCases || 0} valueStyle={{ color: '#ff4d4f' }} /></Col>
              <Col span={6}><Statistic title="通过率" value={report.totalCases ? Math.round(((report.passedCases || 0) / report.totalCases) * 100) : 0} suffix="%" /></Col>
            </Row>
            <Divider />
            <h3>评测概要</h3>
            <p>技能: {report.skillName || '-'}</p>
            <p>状态: {report.status || '-'}</p>
            <p>开始时间: {report.startTime ? new Date(report.startTime).toLocaleString() : '-'}</p>
            <p>结束时间: {report.endTime ? new Date(report.endTime).toLocaleString() : '-'}</p>
          </>
        )}

        {aiAnalysis && (
          <>
            <Divider />
            <h3><RobotOutlined /> AI 智能分析</h3>
            <div style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 8, marginTop: 12 }}>
              {aiAnalysis}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
