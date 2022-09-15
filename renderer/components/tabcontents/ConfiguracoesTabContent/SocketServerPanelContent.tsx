import { Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useIpc } from "../../../hooks/useIpc";

const { Text } = Typography;

export default function SocketServerPanelContent() {
  const ipc = useIpc();
  const [connectionsAmount, setConnectionsAmout] = useState(0);
  const [port, setPort] = useState(0);

  async function loadConnectionsAmount() {
    const response = await ipc.send("socket_connections_amount");
    setConnectionsAmout(response.data);
  }

  async function loadPort() {
    const response = await ipc.send("socket_port");
    setPort(response.data || port);
  }

  ipc.listen("socket_connections_change", (response) =>
    setConnectionsAmout(response.data)
  );

  useEffect(() => {
    loadPort();
    loadConnectionsAmount();
  }, []);

  return (
    <Space direction="vertical" size="small">
      <Text>Porta: {port}</Text>
      <Text>Quantidade de conexões: {connectionsAmount}</Text>
    </Space>
  );
}
