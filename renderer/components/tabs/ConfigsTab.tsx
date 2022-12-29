import { SettingOutlined } from "@ant-design/icons";
import { Badge } from "antd";
import { useEffect, useState } from "react";
import { DATABASE_CONNECTION_STATUS } from "../../../shared/constants/ipc-main-channels.constants";
import { SETTINGS_TAB_DOT } from "../../../shared/constants/ipc-renderer-channels.constants";
import { IpcMessage, IpcRequest } from "../../../shared/ipc/types";
import { useIpcRenderer } from "../../hooks/useIpcRenderer";

export default function ConfigsTab() {
  const ipcRenderer = useIpcRenderer();
  const [showDot, setShowDot] = useState(false);

  function dotListener(message: IpcMessage) {
    setShowDot(message.data === "show");
  }

  ipcRenderer.addHandler(SETTINGS_TAB_DOT, dotListener);

  async function loadDatabaseConnectionStatus() {
    const request: IpcRequest = { channel: DATABASE_CONNECTION_STATUS };
    const response = await ipcRenderer.request(request);
    setShowDot(response.status !== "success");
  }

  useEffect(() => {
    loadDatabaseConnectionStatus();
  }, []);

  return (
    <>
      <SettingOutlined />
      Configurações
      {showDot && <Badge dot></Badge>}
    </>
  );
}
