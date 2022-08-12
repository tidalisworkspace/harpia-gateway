import { Typography } from "antd";
import { useEffect, useState } from "react";
import { IpcResponse } from "../../../../shared/ipc/types";
import { useIpc } from "../../../hooks/useIpc";

const { Title, Text } = Typography;

export default function SocketSection() {
  const ipc = useIpc();
  const [connectionsAmount, setConnectionsAmout] = useState(0);

  async function loadSocketConnectionsAmount() {
    const response = await ipc.send("socket_connections_amount");
    setConnectionsAmout(response.data);
  }

  ipc.listen("socket_connections_change", (response) =>
    setConnectionsAmout(response.data)
  );

  useEffect(() => {
    loadSocketConnectionsAmount();
  }, []);

  return (
    <>
      <Title level={5}>Socket</Title>
      <Text>Quantidade de conexões: {connectionsAmount}</Text>
    </>
  );
}
