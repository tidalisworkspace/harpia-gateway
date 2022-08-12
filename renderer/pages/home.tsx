import { Layout, Tabs, Typography } from "antd";
import React from "react";
import CartoesTab from "../components/tabs/CartoesTab";
import CardsTabContent from "../components/tabcontents/CardsTabContent";
import ConfiguracoesTab from "../components/tabs/ConfiguracoesTab";
import ConfiguracoesTabContent from "../components/tabcontents/ConfiguracoesTabContent";
import DispositivosTab from "../components/tabs/DispositivosTab";
import HardwaresTabContent from "../components/tabcontents/HardwaresTabContent";

const { Title } = Typography;
const { Content } = Layout;
const { TabPane } = Tabs;

export default function Home() {
  return (
    <React.Fragment>
      <Content style={{ padding: 20 }}>
        <Title level={3} style={{ textAlign: "center" }}>
          Harpia Gateway
        </Title>
        <Tabs centered>
          <TabPane tab={<DispositivosTab />} key="1">
            <HardwaresTabContent />
          </TabPane>

          <TabPane tab={<CartoesTab />} key="2">
            <CardsTabContent />
          </TabPane>

          <TabPane tab={<ConfiguracoesTab />} key="3">
            <ConfiguracoesTabContent />
          </TabPane>
        </Tabs>
      </Content>
    </React.Fragment>
  );
}
