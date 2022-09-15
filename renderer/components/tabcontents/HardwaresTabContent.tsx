import {
  ClearOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import {
  Button,
  Divider,
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
import logger from "../../../shared/logger";
import { useIpc } from "../../hooks/useIpc";

const { Text } = Typography;

const manufacturers = {
  "<HIKV>": "Hikvision",
  "<ITBF>": "Intelbras",
};

function getManufacturerName(manufacturer) {
  return manufacturers[manufacturer] || "Desconhecido";
}

interface DataType {
  key: React.Key;
  name: string;
  ip: string;
  port: number;
  manufacturer: string;
}

const columns: ColumnsType<DataType> = [
  {
    key: "id",
    render: (_, { name, manufacturer }) => (
      <Tooltip title={getManufacturerName(manufacturer)} placement="bottom">
        {name.length > 14 ? `${name.slice(0, 14)}...` : name}
      </Tooltip>
    ),
  },
  {
    key: "ip",
    title: "Endereço IP",
    render: (_, { ip, port }) => <Text copyable>{`${ip}:${port}`}</Text>,
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

  const rowSelection: TableRowSelection<DataType> = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[], selectedRows: DataType[]) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    },
  };

  function getSelected(): DataType[] {
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

  async function handleReload() {
    setBusy(true);

    clearSelection();

    await message.loading("Buscando dispositivos");

    const response = await loadHardwares();

    showMessage(response);

    setBusy(false);
  }

  async function handleReboot() {
    setBusy(true);

    await message.loading("Reiniciando dispositivos");

    const response = await rebootHardwares();

    showMessage(response);

    setBusy(false);
  }

  function handleClearSelection() {
    clearSelection();
  }

  async function handleUpdateDateTime() {
    setBusy(true);

    await message.loading("Atualizando data/hora dos dispositivos");

    const response = await updateDateTime();

    showMessage(response);

    setBusy(false);
  }

  async function handleConfigureEventsServer() {
    setBusy(true);

    await message.loading("Configurando servidor de eventos nos dispositivos");

    const response = await configureEventsServer();

    showMessage(response);

    setBusy(false);
  }

  useEffect(() => {
    loadHardwares();
  }, []);

  const menu = (
    <Menu
      items={[
        {
          key: "0",
          icon: <ClockCircleOutlined />,
          label: "Atualizar data/horário",
          onClick: handleUpdateDateTime,
        },
        {
          key: "1",
          icon: <WifiOutlined />,
          label: "Configurar servidor de eventos",
          onClick: handleConfigureEventsServer,
        },
        {
          key: "2",
          icon: <PoweroffOutlined />,
          label: "Reiniciar",
          onClick: handleReboot,
        },
      ]}
    />
  );

  return (
    <>
      <Button
        type="link"
        size="small"
        icon={<ReloadOutlined />}
        disabled={busy}
        onClick={handleReload}
      >
        Buscar dispositivos
      </Button>
      <Button
        type="link"
        size="small"
        danger
        icon={<ClearOutlined />}
        disabled={busy || !selectedRows.length}
        onClick={handleClearSelection}
      >
        Limpar seleção
      </Button>
      <Tooltip title="Ações para os dispositivos selecionados ou todos se nenhum for previamente selecionado">
        <Dropdown overlay={menu} trigger={["click"]} disabled={busy}>
          <a onClick={(e) => e.preventDefault()}>
            <Space size={3}>
              <MoreOutlined />
              Mais ações
            </Space>
          </a>
        </Dropdown>
      </Tooltip>
      <Table
        rowSelection={{ type: "checkbox", ...rowSelection }}
        showHeader={false}
        columns={columns}
        dataSource={hardwares}
        pagination={false}
      />
    </>
  );
}
