import { Collapse, Typography } from "antd";
import DatabaseConnectionPanelContent from "./DatabaseConnectionPanelContent";
import HttpServerPanelContent from "./HttpServerPanelContent";
import LogsPanelContent from "./LogsPanelContent";
import SocketServerPanelContent from "./SocketServerPanelContent";

const { Panel } = Collapse;
const { Title } = Typography;

export default function ConfiguracoesTabContent() {
  return (
    <>
      <Collapse ghost>
        <Panel key="0" header={<Title level={5}>Logs</Title>}>
          <LogsPanelContent />
        </Panel>
        <Panel
          key="1"
          header={<Title level={5}>Conexão do banco de dados</Title>}
        >
          <DatabaseConnectionPanelContent />
        </Panel>
        <Panel key="2" header={<Title level={5}>Servidor Socket</Title>}>
          <SocketServerPanelContent />
        </Panel>
        <Panel key="3" header={<Title level={5}>Servidor HTTP</Title>}>
          <HttpServerPanelContent />
        </Panel>
      </Collapse>
    </>
  );
}
