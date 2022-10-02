import { SettingOutlined } from "@ant-design/icons";
import { Badge } from "antd";
import { useEffect, useState } from "react";
import { DATABASE_CONNECTION_STATUS } from "../../../shared/constants/ipc-main-channels.constants";
import { SETTINGS_TAB_DOT } from "../../../shared/constants/ipc-renderer-channels.constants";
import { IpcResponse } from "../../../shared/ipc/types";
import { useIpcRenderer } from "../../hooks/useIpcRenderer";

export default function ConfigsTab() {
  const ipcRenderer = useIpcRenderer();
  const [showDot, setShowDot] = useState(false);

  function dotListener(response: IpcResponse) {
    setShowDot(response.data === "show");
  }

  ipcRenderer.listen(SETTINGS_TAB_DOT, dotListener);

  async function loadDatabaseConnectionStatus() {
    const response = await ipcRenderer.request(DATABASE_CONNECTION_STATUS);
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
