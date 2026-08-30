import { Card, Row, Col, Statistic } from 'antd';
import { CheckCircleOutlined, RobotOutlined, DatabaseOutlined, PlayCircleOutlined } from '@ant-design/icons';

function Dashboard() {
  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="智能体数量" value={0} prefix={<RobotOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="数据集数量" value={0} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="评测次数" value={0} prefix={<PlayCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="通过率" value={0} suffix="%" prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>
      <Card title="最近评测" style={{ marginTop: 24 }}>
        <p>暂无数据</p>
      </Card>
    </div>
  );
}

export default Dashboard;
