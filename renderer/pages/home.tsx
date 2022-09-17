import { Layout, Tabs, Typography } from "antd";
import CardsTabContent from "../components/tabcontents/CardsTabContent";
import ConfiguracoesTabContent from "../components/tabcontents/ConfiguracoesTabContent";
import HardwaresTabContent from "../components/tabcontents/HardwaresTabContent";
import CardsTab from "../components/tabs/CardsTab";
import ConfigsTab from "../components/tabs/ConfigsTab";
import HardwaresTab from "../components/tabs/HardwaresTab";

const { Title } = Typography;
const { Content } = Layout;
const { TabPane } = Tabs;

export default function Home() {
  return (
    <Content style={{ padding: 20 }}>
      <Title level={3} style={{ textAlign: "center" }}>
        Harpia Gateway
      </Title>
      <Tabs centered>
        <TabPane tab={<HardwaresTab />} key="1">
          <HardwaresTabContent />
        </TabPane>

        <TabPane tab={<CardsTab />} key="2">
          <CardsTabContent />
        </TabPane>

        <TabPane tab={<ConfigsTab />} key="3">
          <ConfiguracoesTabContent />
        </TabPane>
      </Tabs>
    </Content>
  );
}
