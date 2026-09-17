import { useState, useEffect } from 'react';
import { Table, Button, Card, Modal, Form, Input, Space, Tag, message, Popconfirm, Row, Col, Statistic } from 'antd';
import { PlusOutlined, AppstoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';

interface Skill {
  id: string;
  name: string;
  description: string | null;
  version: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    endpoints: number;
    evalRuns: number;
    skillVersions: number;
  };
}

interface SkillDetail extends Skill {
  endpoints: any[];
  evalRuns: any[];
  skillVersions: any[];
}

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<SkillDetail | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/skills');
      setSkills(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSkills(); }, []);

  const handleCreate = async (values: any) => {
    try {
      await axios.post('/api/skills', values);
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchSkills();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '创建失败');
    }
  };

  const handleEdit = async (values: any) => {
    if (!currentSkill) return;
    try {
      await axios.put(`/api/skills/${currentSkill.id}`, values);
      message.success('更新成功');
      setEditModalOpen(false);
      editForm.resetFields();
      fetchSkills();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/skills/${id}`);
      message.success('删除成功');
      fetchSkills();
    } catch (e: any) {
      message.error('删除失败');
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await axios.get(`/api/skills/${id}`);
      setCurrentSkill(res.data);
      setDetailModalOpen(true);
    } catch (e: any) {
      message.error('获取详情失败');
    }
  };

  const openEditModal = (skill: Skill) => {
    setCurrentSkill(skill as SkillDetail);
    editForm.setFieldsValue({
      name: skill.name,
      description: skill.description,
      version: skill.version,
    });
    setEditModalOpen(true);
  };

  const columns = [
    { title: '技能名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { 
      title: '版本', dataIndex: 'version', key: 'version',
      render: (v: string) => <Tag color="blue">{v}</Tag>
    },
    {
      title: '接入点', key: 'endpoints',
      render: (_: any, record: Skill) => record._count?.endpoints || 0
    },
    {
      title: '评测次数', key: 'evalRuns',
      render: (_: any, record: Skill) => record._count?.evalRuns || 0
    },
    {
      title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt',
      render: (v: string) => new Date(v).toLocaleString()
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Skill) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>编辑</Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title={<><AppstoreOutlined /> 技能管理</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建技能</Button>}
      >
        <Table columns={columns} dataSource={skills} rowKey="id" loading={loading} />
      </Card>

      {/* 新建技能弹窗 */}
      <Modal title="新建技能" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="技能名称" rules={[{ required: true, message: '请输入技能名称' }]}>
            <Input placeholder="如: 客服问答技能" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="技能描述..." rows={3} />
          </Form.Item>
          <Form.Item name="version" label="版本号" initialValue="1.0.0">
            <Input placeholder="1.0.0" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑技能弹窗 */}
      <Modal title="编辑技能" open={editModalOpen} onCancel={() => setEditModalOpen(false)} onOk={() => editForm.submit()} destroyOnClose>
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="name" label="技能名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="version" label="版本号">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal 
        title={`技能详情 - ${currentSkill?.name || ''}`} 
        open={detailModalOpen} 
        onCancel={() => setDetailModalOpen(false)} 
        footer={null}
        width={720}
      >
        {currentSkill && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic title="接入点数量" value={currentSkill.endpoints?.length || 0} />
              </Col>
              <Col span={8}>
                <Statistic title="评测次数" value={currentSkill.evalRuns?.length || 0} />
              </Col>
              <Col span={8}>
                <Statistic title="版本数" value={currentSkill.skillVersions?.length || 0} />
              </Col>
            </Row>

            <h4>基本信息</h4>
            <p><strong>名称：</strong>{currentSkill.name}</p>
            <p><strong>描述：</strong>{currentSkill.description || '无'}</p>
            <p><strong>当前版本：</strong><Tag color="blue">{currentSkill.version}</Tag></p>
            <p><strong>创建时间：</strong>{new Date(currentSkill.createdAt).toLocaleString()}</p>

            {currentSkill.endpoints && currentSkill.endpoints.length > 0 && (
              <>
                <h4 style={{ marginTop: 16 }}>接入点列表</h4>
                <Table
                  size="small"
                  dataSource={currentSkill.endpoints}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '名称', dataIndex: 'name' },
                    { title: '地址', dataIndex: 'url', ellipsis: true },
                    { title: '认证', dataIndex: 'authType' },
                  ]}
                />
              </>
            )}

            {currentSkill.evalRuns && currentSkill.evalRuns.length > 0 && (
              <>
                <h4 style={{ marginTop: 16 }}>最近评测</h4>
                <Table
                  size="small"
                  dataSource={currentSkill.evalRuns}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'completed' ? 'green' : v === 'running' ? 'blue' : 'default'}>{v}</Tag> },
                    { title: '通过', dataIndex: 'passedCases' },
                    { title: '失败', dataIndex: 'failedCases' },
                    { title: '时间', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleString() },
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
