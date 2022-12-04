import { Space, Typography } from "antd";
import { useEffect, useState } from "react";
import {
  SOCKET_CONNECTIONS_AMOUNT,
  SOCKET_PORT,
  SOCKET_STATE,
} from "../../../../shared/constants/ipc-main-channels.constants";
import { SOCKET_CONNECTIONS_CHANGE } from "../../../../shared/constants/ipc-renderer-channels.constants";
import { useIpcRenderer } from "../../../hooks/useIpcRenderer";
import Status from "../../Status";

const { Text } = Typography;

function State() {
  const ipcRenderer = useIpcRenderer();
  const [type, setType] = useState("loading");

  const types = {
    starting: <Status title="Estado" text="Iniciando" loading />,
    running: <Status title="Estado" text="Rodando" success />,
    stopped: <Status title="Estado" text="Parado" failed />,
    loading: <Status title="Estado" text="Carregando" loading />,
    error: <Status title="Estado" text="Erro" failed />,
  };

  async function loadState() {
    const response = await ipcRenderer.request(SOCKET_STATE);
    setType(response.data || types.error);
  }

  useEffect(() => {
    loadState();
  }, []);

  return types[type];
}

export default function SocketServerPanelContent() {
  const ipcRenderer = useIpcRenderer();
  const [connectionsAmount, setConnectionsAmout] = useState(0);
  const [camerasAmount, setCamerasAmount] = useState(0);
  const [port, setPort] = useState(0);

  async function loadConnectionsAmount() {
    const response = await ipcRenderer.request(SOCKET_CONNECTIONS_AMOUNT);
    setConnectionsAmout(response.data.connectionsAmount);
    setCamerasAmount(response.data.camerasAmount)
  }

  async function loadPort() {
    const response = await ipcRenderer.request(SOCKET_PORT);
    setPort(response.data || port);
  }

  ipcRenderer.listen(SOCKET_CONNECTIONS_CHANGE, (response) => {
    setConnectionsAmout(response.data.connectionsAmount);
    setCamerasAmount(response.data.camerasAmount);
  });

  useEffect(() => {
    loadPort();
    loadConnectionsAmount();
  }, []);

  return (
    <Space direction="vertical" size="small">
      <State />
      <Text>Porta: {port}</Text>
      <Text>Quantidade de conexões: {connectionsAmount}</Text>
      <Text>Quantidade de câmeras: {camerasAmount}</Text>
    </Space>
  );
}
