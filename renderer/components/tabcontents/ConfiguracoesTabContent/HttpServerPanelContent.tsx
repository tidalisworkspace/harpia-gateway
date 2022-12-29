import { Space, Typography } from "antd";
import { useEffect, useState } from "react";
import {
  HTTP_IP,
  HTTP_PORT,
  HTTP_STATE,
} from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcRequest } from "../../../../shared/ipc/types";
import { useIpcRenderer } from "../../../hooks/useIpcRenderer";
import Status from "../../Status";

const { Text } = Typography;

function State() {
  const ipcRenderer = useIpcRenderer();
  const [type, setType] = useState("loading");

  const types = {
    running: <Status title="Estado" text="Rodando" success />,
    stopped: <Status title="Estado" text="Parado" failed />,
    loading: <Status title="Estado" text="Carregando" loading />,
    error: <Status title="Estado" text="Erro" failed />,
  };

  async function loadState() {
    const request: IpcRequest = { channel: HTTP_STATE };
    const response = await ipcRenderer.request(request);
    setType(response.data || types.error);
  }

  useEffect(() => {
    loadState();
  }, []);

  return types[type];
}

export default function HttpServerPanelContent() {
  const ipcRenderer = useIpcRenderer();
  const [port, setPort] = useState(0);
  const [ip, setIp] = useState("0.0.0.0");

  async function loadIp() {
    const request: IpcRequest = { channel: HTTP_IP };
    const response = await ipcRenderer.request(request);
    setIp(response.data || ip);
  }

  async function loadPort() {
    const request: IpcRequest = { channel: HTTP_PORT };
    const response = await ipcRenderer.request(request);
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
