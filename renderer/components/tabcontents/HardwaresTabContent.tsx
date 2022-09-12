import { ReloadOutlined } from "@ant-design/icons";
import { Button, Divider, message, Table, Tooltip, Typography } from "antd";
import { ColumnsType } from "antd/lib/table";
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
  const [selectedRows, setSelectedRows] = useState([]);
  const [reloading, setRealoading] = useState(false);
  const [rebooting, setRebooting] = useState(false);

  const rowSelection = {
    onChange: (_: React.Key[], selectedRows: DataType[]) =>
      setSelectedRows(selectedRows),
  };

  async function loadHardwares(): Promise<IpcResponse> {
    const response = await ipc.send("hardware_find_all");

    setHardwares(response.data || hardwares);

    return response;
  }

  async function rebootHardwares(): Promise<IpcResponse> {
    const request: IpcRequest = {
      params: selectedRows,
    };

    const response = await ipc.send("hardware_reboot", request);

    return response;
  }

  async function handleReload() {
    setRealoading(true);

    await message.loading("Buscando dispositivos");

    const response = await loadHardwares();

    showMessage(response);

    setRealoading(false);
  }

  async function handleReboot() {
    setRebooting(true);

    await message.loading("Reiniciando dispositivos");

    const response = await rebootHardwares();

    showMessage(response);

    setRebooting(false);
  }

  useEffect(() => {
    loadHardwares();
  }, []);

  return (
    <>
      <Button
        type="link"
        icon={<ReloadOutlined />}
        size="small"
        onClick={handleReload}
        loading={reloading}
      >
        Buscar dispositivos
      </Button>
      <Divider type="vertical" />
      <Button
        type="link"
        size="small"
        disabled={!selectedRows.length}
        onClick={handleReboot}
        loading={rebooting}
      >
        Reiniciar selecionados
      </Button>
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
