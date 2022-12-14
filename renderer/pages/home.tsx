import { Layout, Space, Tabs, Typography } from "antd";
import { useEffect, useState } from "react";
import logger from "../../shared/logger";
import CardsTabContent from "../components/tabcontents/CardsTabContent";
import ConfiguracoesTabContent from "../components/tabcontents/ConfiguracoesTabContent";
import HardwaresTabContent from "../components/tabcontents/HardwaresTabContent";
import CardsTab from "../components/tabs/CardsTab";
import ConfigsTab from "../components/tabs/ConfigsTab";
import HardwaresTab from "../components/tabs/HardwaresTab";
import { useIpc } from "../hooks/useIpc";

const { Title, Text } = Typography;
const { Content } = Layout;
const { TabPane } = Tabs;

function Version() {
  const ipc = useIpc();
  const [version, setVersion] = useState(null);

  async function loadVersion() {
    const response = await ipc.send("app_version");

    logger.info(response)

    setVersion(response.data || version);

    return response;
  }

  useEffect(() => {
    loadVersion();
  }, []);

  if (!version) {
    return;
  }

  return <Text type="secondary">v{version}</Text>;
}

export default function Home() {
  return (
    <Content style={{ padding: 20 }}>
      <Space
        direction="vertical"
        size={0}
        align="center"
        style={{ width: "100%" }}
      >
        <Title level={3} style={{ marginBottom: 0 }}>
          Harpia Gateway
        </Title>
        <Version />
      </Space>
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
