import { ClearOutlined, FileFilled, ReloadOutlined } from "@ant-design/icons";
import { Button, message, Popconfirm, Row, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import {
  LOGGER_FILE_CLEAN,
  LOGGER_FILE_OPEN,
  LOGGER_FILE_SIZE,
} from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import { useIpcRenderer } from "../../../hooks/useIpcRenderer";

const { Text } = Typography;

function showMessage(response: IpcResponse) {
  if (!response.message) {
    return;
  }

  message[response.status](response.message);
}

export default function LogsPanelContent() {
  const [fileSize, setFileSize] = useState("0 Bytes");
  const ipcRenderer = useIpcRenderer();

  async function loadFileSize(): Promise<IpcResponse> {
    const response = await ipcRenderer.request(LOGGER_FILE_SIZE);

    setFileSize(response.data || fileSize);

    return response;
  }

  function handleReload() {
    message.loading("Atualizando informações de log").then(loadFileSize).then(showMessage);
  }

  function handleOpenLogs() {
    message
      .loading("Abrindo logs")
      .then(() => ipcRenderer.request(LOGGER_FILE_OPEN))
      .then(showMessage);
  }

  function handleCleanLogs() {
    message
      .loading("Limpando logs")
      .then(() => ipcRenderer.request(LOGGER_FILE_CLEAN))
      .then(loadFileSize)
      .then(showMessage);
  }

  useEffect(() => {
    loadFileSize();
  }, []);

  return (
    <>
      <Row>
        <Space direction="vertical" size="small">
          <Button
            type="link"
            shape="circle"
            icon={<ReloadOutlined />}
            loading={false}
            size="small"
            onClick={handleReload}
          >
            Atualizar informações
          </Button>
          <Text>Tamanho do arquivo: {fileSize}</Text>
        </Space>
      </Row>
      <Row>
        <Space size="small">
          <Button
            type="link"
            shape="circle"
            icon={<FileFilled />}
            onClick={handleOpenLogs}
          >
            Abrir logs
          </Button>
          <Popconfirm
            title="Tem certeza que deseja limpar?"
            okText="Sim"
            cancelText="Não"
            onConfirm={handleCleanLogs}
          >
            <Button type="link" shape="circle" danger icon={<ClearOutlined />}>
              Limpar logs
            </Button>
          </Popconfirm>
        </Space>
      </Row>
    </>
  );
}
