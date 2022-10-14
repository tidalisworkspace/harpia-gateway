import {
  ClearOutlined,
  ClockCircleOutlined,
  CloudOutlined,
  MoreOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Dropdown,
  Menu,
  message,
  Space,
  Table,
  Tooltip,
  Typography,
} from "antd";
import { MessageType } from "antd/lib/message";
import { ColumnsType } from "antd/lib/table";
import { TableRowSelection } from "antd/lib/table/interface";
import { PresetStatusColorType } from "antd/lib/_util/colors";
import { ReactNode, useEffect, useState } from "react";
import {
  HARDWARE_CONNECTION_TEST,
  HARDWARE_DATETIME_UPDATE,
  HARDWARE_EVENTS_SERVER_UPDATE,
  HARDWARE_FIND_ALL,
  HARDWARE_REBOOT,
} from "../../../shared/constants/ipc-main-channels.constants";
import { IpcRequest, IpcResponse } from "../../../shared/ipc/types";
import { useIpcRenderer } from "../../hooks/useIpcRenderer";

const { Text } = Typography;

const manufacturers = {
  "<HIKV>": "Hikvision",
  "<ITBF>": "Intelbras",
  "<CIBM>": "Control iD",
};

function getManufacturerName(manufacturer) {
  return manufacturers[manufacturer] || "Desconhecido";
}

interface ConnectionInfo {
  status: PresetStatusColorType;
  tip: ReactNode;
}

const connectionInfos: { [key: string]: ConnectionInfo } = {
  default: {
    status: "default",
    tip: "Sem informações sobre a conexão, teste a conexão para obter um resultado",
  },
  ping_failed: {
    status: "error",
    tip: "Não encontrado na rede",
  },
  response_not_ok: {
    status: "warning",
    tip: (
      <>
        Encontrado na rede e <strong>dispositivo não responde</strong>
      </>
    ),
  },
  invalid_credentials: {
    status: "processing",
    tip: (
      <>
        Encontrado na rede, dispositivo respondendo e{" "}
        <strong>credenciais inválidas</strong>
      </>
    ),
  },
  connected: {
    status: "success",
    tip: "Endereço IP encontrado na rede, dispositivo respondendo e credenciais válidas",
  },
};

function getConnectionInfo(connection): ConnectionInfo {
  return connectionInfos[connection] || connectionInfos.default;
}

interface Hardware {
  key: React.Key;
  name: string;
  ip: string;
  port: number;
  manufacturer: string;
  connection: "connected" | "disconnected" | "need_attention";
}

const columns: ColumnsType<Hardware> = [
  {
    key: "id",
    ellipsis: {
      showTitle: false,
    },
    render: (_, { name, manufacturer }) => (
      <Tooltip
        title={`${name} (${getManufacturerName(manufacturer)})`}
        placement="bottom"
      >
        {name} ({getManufacturerName(manufacturer)})
      </Tooltip>
    ),
  },
  {
    key: "ip",
    render: (_, { ip, port }) => <Text copyable>{`${ip}:${port}`}</Text>,
  },
  {
    key: "status",
    width: "10%",
    render: (_, { connection }) => (
      <Tooltip title={getConnectionInfo(connection).tip} placement="left">
        <Badge status={getConnectionInfo(connection).status} />
      </Tooltip>
    ),
  },
];

function showMessage(response: IpcResponse): MessageType {
  if (!response.message) {
    return;
  }

  return message[response.status](response.message);
}

export default function HardwaresTabContent() {
  const ipcRenderer = useIpcRenderer();
  const [hardwares, setHardwares] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [busy, setBusy] = useState(false);

  function toggleBusy() {
    setBusy((busy) => !busy);
  }

  const rowSelection: TableRowSelection<Hardware> = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[], selectedRows: Hardware[]) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    },
  };

  function getSelected(): Hardware[] {
    return selectedRows.length ? selectedRows : hardwares;
  }

  async function loadHardwares(): Promise<IpcResponse> {
    const response = await ipcRenderer.request(HARDWARE_FIND_ALL);

    setHardwares(response.data || hardwares);

    return response;
  }

  async function rebootHardwares(): Promise<IpcResponse> {
    const params = getSelected();

    const request: IpcRequest = { params };

    const response = await ipcRenderer.request(HARDWARE_REBOOT, request);

    return response;
  }

  function clearSelection() {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }

  async function updateDateTime(): Promise<IpcResponse> {
    const params = getSelected();

    const request: IpcRequest = { params };

    const response = await ipcRenderer.request(
      HARDWARE_DATETIME_UPDATE,
      request
    );

    return response;
  }

  async function configureEventsServer(): Promise<IpcResponse> {
    const params = getSelected();

    const request: IpcRequest = { params };

    const response = await ipcRenderer.request(
      HARDWARE_EVENTS_SERVER_UPDATE,
      request
    );

    return response;
  }

  async function testConnection(): Promise<IpcResponse> {
    const params = getSelected();

    const request: IpcRequest = { params };

    const response = await ipcRenderer.request(
      HARDWARE_CONNECTION_TEST,
      request
    );

    return response;
  }

  function handleLoad() {
    toggleBusy();

    clearSelection();

    message
      .loading("Buscando dispositivos")
      .then(loadHardwares)
      .then(showMessage)
      .then(toggleBusy);
  }

  function handleReboot() {
    toggleBusy();

    message
      .loading("Reiniciando dispositivos")
      .then(rebootHardwares)
      .then(showMessage)
      .then(toggleBusy);
  }

  function handleClearSelection() {
    clearSelection();
  }

  function handleUpdateDateTime() {
    toggleBusy();

    message
      .loading("Atualizando data/hora dos dispositivos")
      .then(updateDateTime)
      .then(showMessage)
      .then(toggleBusy);
  }

  function handleConfigureEventsServer() {
    toggleBusy();

    message
      .loading("Configurando servidor de eventos nos dispositivos")
      .then(configureEventsServer)
      .then(showMessage)
      .then(toggleBusy);
  }

  function handleTestConnection() {
    toggleBusy();

    message
      .loading("Testando conexão")
      .then(testConnection)
      .then(showMessage)
      .then(() => message.loading("Buscando dispositivos"))
      .then(loadHardwares)
      .then(showMessage)
      .then(toggleBusy);
  }

  useEffect(() => {
    loadHardwares();
  }, []);

  const menu = (
    <Menu
      items={[
        {
          key: "test-connection",
          icon: <WifiOutlined />,
          label: "Testar conexão",
          onClick: handleTestConnection,
        },
        {
          key: "update-datetime",
          icon: <ClockCircleOutlined />,
          label: "Atualizar data/horário",
          onClick: handleUpdateDateTime,
        },
        {
          key: "configure-events-server",
          icon: <CloudOutlined />,
          label: "Configurar servidor de eventos",
          onClick: handleConfigureEventsServer,
        },
        {
          key: "reboot",
          icon: <PoweroffOutlined />,
          label: "Reiniciar",
          onClick: handleReboot,
        },
      ]}
    />
  );

  return (
    <Space direction="vertical">
      <Space size="small">
        <Button
          type="link"
          shape="circle"
          size="small"
          icon={<ReloadOutlined />}
          disabled={busy}
          onClick={handleLoad}
        >
          Buscar dispositivos
        </Button>
        <Button
          type="link"
          shape="circle"
          size="small"
          danger
          icon={<ClearOutlined />}
          disabled={busy || !selectedRows.length}
          onClick={handleClearSelection}
        >
          Limpar seleção
        </Button>
        <Tooltip
          title="Ações para os dispositivos selecionados ou todos se nenhum for previamente selecionado"
          placement="left"
        >
          <Dropdown overlay={menu} trigger={["click"]} disabled={busy}>
            <a onClick={(e) => e.preventDefault()}>
              <Space size={3}>
                <MoreOutlined />
                Mais ações
              </Space>
            </a>
          </Dropdown>
        </Tooltip>
      </Space>
      <Table
        size="small"
        rowSelection={{ type: "checkbox", ...rowSelection }}
        showHeader={false}
        columns={columns}
        dataSource={hardwares}
        pagination={false}
      />
    </Space>
  );
}
