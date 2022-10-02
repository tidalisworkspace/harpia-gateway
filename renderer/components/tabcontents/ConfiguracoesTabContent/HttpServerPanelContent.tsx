import { Space, Typography } from "antd";
import { useEffect, useState } from "react";
import {
  HTTP_IP,
  HTTP_PORT,
  HTTP_STATE,
} from "../../../../shared/constants/ipc-main-channels";
import { useIpc } from "../../../hooks/useIpc";
import Status from "../../Status";

const { Text } = Typography;

function State() {
  const ipc = useIpc();
  const [type, setType] = useState("loading");

  const types = {
    running: <Status title="Estado" text="Rodando" success />,
    stopped: <Status title="Estado" text="Parado" failed />,
    loading: <Status title="Estado" text="Carregando" loading />,
    error: <Status title="Estado" text="Erro" failed />,
  };

  async function loadState() {
    const response = await ipc.send(HTTP_STATE);
    setType(response.data || types.error);
  }

  useEffect(() => {
    loadState();
  }, []);

  return types[type];
}

export default function HttpServerPanelContent() {
  const ipc = useIpc();
  const [port, setPort] = useState(0);
  const [ip, setIp] = useState("0.0.0.0");

  async function loadIp() {
    const response = await ipc.send(HTTP_IP);
    setIp(response.data || ip);
  }

  async function loadPort() {
    const response = await ipc.send(HTTP_PORT);
    setPort(response.data || port);
  }

  useEffect(() => {
    loadIp();
    loadPort();
  }, []);

  return (
    <Space direction="vertical" size="small">
      <State />
      <Text>IP: {ip}</Text>
      <Text>Porta: {port}</Text>
    </Space>
  );
}
