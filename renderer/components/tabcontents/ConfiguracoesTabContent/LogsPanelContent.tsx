import { ClearOutlined, FileFilled, ReloadOutlined } from "@ant-design/icons";
import { Button, message, Popconfirm, Row, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import {
  LOGGER_FILE_CLEAN,
  LOGGER_FILE_OPEN,
  LOGGER_FILE_SIZE,
} from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcRequest, IpcResponse } from "../../../../shared/ipc/types";
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
    const request: IpcRequest = { channel: LOGGER_FILE_SIZE };

    const response = await ipcRenderer.request(request);

    setFileSize(response.data || fileSize);

    return response;
  }

  function handleReload() {
    message
      .loading("Atualizando informações de log")
      .then(loadFileSize)
      .then(showMessage);
  }

  function handleOpenLogs() {
    const request: IpcRequest = { channel: LOGGER_FILE_OPEN };

    message
      .loading("Abrindo logs")
      .then(() => ipcRenderer.request(request))
      .then(showMessage);
  }

  function handleCleanLogs() {
    const request: IpcRequest = { channel: LOGGER_FILE_CLEAN };

    message
      .loading("Limpando logs")
      .then(() => ipcRenderer.request(request))
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
