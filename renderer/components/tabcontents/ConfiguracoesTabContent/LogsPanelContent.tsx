import { ClearOutlined, FileFilled, ReloadOutlined } from "@ant-design/icons";
import { Button, message, Popconfirm, Row, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { IpcResponse } from "../../../../shared/ipc/types";
import { useIpc } from "../../../hooks/useIpc";

const { Text } = Typography;

function showMessage(response: IpcResponse) {
  if (!response.message) {
    return;
  }

  message[response.status](response.message);
}

export default function LogsPanelContent() {
  const [fileSize, setFileSize] = useState("0 Bytes");
  const ipc = useIpc();

  ipc.listen("logger_file_size_change", (response) =>
    setFileSize(response.data)
  );

  async function loadFileSize(): Promise<IpcResponse> {
    const response = await ipc.send("logger_file_size");

    setFileSize(response.data || fileSize);

    return response;
  }

  async function handleReload() {
    await message.loading("Atualizando");

    const response = await loadFileSize();
    showMessage(response);
  }

  async function handleOpenLogs() {
    await message.loading("Abrindo logs");

    const response = await ipc.send("logger_file_open");
    showMessage(response);
  }

  async function handleCleanLogs() {
    await message.loading("Limpando logs");

    const response = await ipc.send("logger_file_clean");
    showMessage(response);
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
            Atualizar
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
