import { Space, Typography } from "antd";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    ipc
      .send("http_state")
      .then((response) => setType(response.data || "error"));
  }, []);

  return types[type];
}

export default function HttpServerPanelContent() {
  const ipc = useIpc();
  const [port, setPort] = useState(0);
  const [ip, setIp] = useState("0.0.0.0");

  async function loadIp() {
    const response = await ipc.send("http_ip");
    setIp(response.data || ip);
  }

  async function loadPort() {
    const response = await ipc.send("http_port");
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
