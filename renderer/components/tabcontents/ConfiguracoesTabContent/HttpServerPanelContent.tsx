import { Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useIpc } from "../../../hooks/useIpc";

const { Text } = Typography;

export default function HttpServerPanelContent() {
  const ipc = useIpc();
  const [port, setPort] = useState(0);

  async function loadPort() {
    const response = await ipc.send("http_port");
    setPort(response.data || port);
  }

  useEffect(() => {
    loadPort();
  }, []);

  return (
    <Space direction="vertical" size="small">
      <Text>Porta: {port}</Text>
    </Space>
  );
}
