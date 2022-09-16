import { Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useIpc } from "../../../hooks/useIpc";
import Status from "../../Status";

const { Text } = Typography;

function State() {
  const ipc = useIpc();
  const [type, setType] = useState("loading");

  const types = {
    starting: <Status title="Estado" text="Iniciando" loading />,
    running: <Status title="Estado" text="Rodando" success />,
    stopped: <Status title="Estado" text="Parado" failed />,
    loading: <Status title="Estado" text="Carregando" loading />,
    error: <Status title="Estado" text="Erro" failed />,
  };

  useEffect(() => {
    ipc
      .send("socket_state")
      .then((response) => setType(response.data || "error"));
  }, []);

  return types[type];
};

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
      <State />
      <Text>Porta: {port}</Text>
      <Text>Quantidade de conexões: {connectionsAmount}</Text>
    </Space>
  );
}
