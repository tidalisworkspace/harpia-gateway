import { SettingOutlined } from "@ant-design/icons";
import { Badge } from "antd";
import { useEffect, useState } from "react";
import { IpcResponse } from "../../../shared/ipc/types";
import { useIpc } from "../../hooks/useIpc";

export default function ConfigsTab() {
  const ipc = useIpc();

  const [showDot, setShowDot] = useState(false);

  ipc.listen("settings_tab_dot", (response) =>
    setShowDot(response.data === "show")
  );

  async function loadDatabaseConnectionStatus() {
    const response = await ipc.send("database_connection_status");
    setShowDot(response.data !== "connected");
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
