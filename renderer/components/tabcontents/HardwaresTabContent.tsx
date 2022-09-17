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
import { ColumnsType } from "antd/lib/table";
import { TableRowSelection } from "antd/lib/table/interface";
import { useEffect, useState } from "react";
import { IpcRequest, IpcResponse } from "../../../shared/ipc/types";
import { useIpc } from "../../hooks/useIpc";

const { Text } = Typography;

const manufacturers = {
  "<HIKV>": "Hikvision",
  "<ITBF>": "Intelbras",
};

function getManufacturerName(manufacturer) {
  return manufacturers[manufacturer] || "Desconhecido";
}

const connectionInfos = {
  none: {
    color: "gray",
    tip: "Nenhum teste de conexão realizado ou nenhum resultado disponível",
  },
  connected: {
    color: "green",
    tip: "Endereço IP existe na rede e dispositivo respondendo normalmente",
  },
  disconnected: {
    color: "red",
    tip: "Endereço IP não existe na rede",
  },
  need_attention: {
    color: "orange",
    tip: "Endereço IP existe na rede e dispositivo não responde",
  },
};

function getConnectionInfo(connection) {
  return connectionInfos[connection] || connectionInfos.none;
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
        <Badge color={getConnectionInfo(connection).color} />
      </Tooltip>
    ),
  },
];

function showMessage(response: IpcResponse) {
  if (!response.message) {
    return;
  }

  message[response.status](response.message);
}

export default function HardwaresTabContent() {
  const ipc = useIpc();
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
    const response = await ipc.send("hardware_find_all");

    setHardwares(response.data || hardwares);

    return response;
  }

  async function rebootHardwares(): Promise<IpcResponse> {
    const params = getSelected();

    const request: IpcRequest = { params };

    const response = await ipc.send("hardware_reboot", request);

    return response;
  }

  function clearSelection() {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }

  async function updateDateTime(): Promise<IpcResponse> {
    const params = getSelected();

    const request: IpcRequest = { params };

    const response = await ipc.send("hardware_update_datetime", request);

    return response;
  }

  async function configureEventsServer(): Promise<IpcResponse> {
    const params = getSelected();

    const request: IpcRequest = { params };

    const response = await ipc.send(
      "hardware_configure_events_server",
      request
    );

    return response;
  }

  async function testConnection(): Promise<IpcResponse> {
    const params = getSelected();

    const request: IpcRequest = { params };

    const response = await ipc.send("hardware_test_connection", request);

    return response;
  }

  async function handleLoad() {
    toggleBusy();

    clearSelection();

    await message.loading("Buscando dispositivos");

    const response = await loadHardwares();

    showMessage(response);

    toggleBusy();
  }

  async function handleReboot() {
    toggleBusy();

    await message.loading("Reiniciando dispositivos");

    const response = await rebootHardwares();

    showMessage(response);

    toggleBusy();
  }

  function handleClearSelection() {
    clearSelection();
  }

  async function handleUpdateDateTime() {
    toggleBusy();

    await message.loading("Atualizando data/hora dos dispositivos");

    const response = await updateDateTime();

    showMessage(response);

    toggleBusy();
  }

  async function handleConfigureEventsServer() {
    toggleBusy();

    await message.loading("Configurando servidor de eventos nos dispositivos");

    const response = await configureEventsServer();

    showMessage(response);

    toggleBusy();
  }

  async function handleTestConnection() {
    toggleBusy();

    await message.loading("Testando conexão");

    const response = await testConnection();

    loadHardwares();

    showMessage(response);

    toggleBusy();
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
