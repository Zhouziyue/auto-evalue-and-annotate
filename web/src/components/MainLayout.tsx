import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  RobotOutlined,
  DatabaseOutlined,
  PlayCircleOutlined,
  EditOutlined,
  BarChartOutlined,
  BranchesOutlined,
} from '@ant-design/icons';

const { Sider, Content, Header } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '看板' },
  { key: '/skills', icon: <AppstoreOutlined />, label: '技能管理' },
  { key: '/agents', icon: <RobotOutlined />, label: '智能体管理' },
  { key: '/datasets', icon: <DatabaseOutlined />, label: '评测数据集' },
  { key: '/eval-runs', icon: <PlayCircleOutlined />, label: '评测执行' },
  { key: '/annotations', icon: <EditOutlined />, label: '标注管理' },
  { key: '/reports', icon: <BarChartOutlined />, label: '评测报告' },
  { key: '/pipelines', icon: <BranchesOutlined />, label: '流水线' },
];

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, color: '#fff', textAlign: 'center', fontSize: collapsed ? 12 : 16, fontWeight: 'bold' }}>
          {collapsed ? '评测' : '技能评测系统'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {menuItems.find((item) => item.key === location.pathname)?.label || '看板'}
          </h2>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
