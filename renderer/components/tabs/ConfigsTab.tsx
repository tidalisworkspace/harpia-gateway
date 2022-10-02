import { SettingOutlined } from "@ant-design/icons";
import { Badge } from "antd";
import { useEffect, useState } from "react";
import { DATABASE_CONNECTION_STATUS } from "../../../shared/constants/ipc-main-channels";
import { useIpcRenderer } from "../../hooks/useIpcRenderer";

export default function ConfigsTab() {
  const ipcRenderer = useIpcRenderer();

  const [showDot, setShowDot] = useState(false);

  ipcRenderer.listen("settings_tab_dot", (response) =>
    setShowDot(response.data === "show")
  );

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
