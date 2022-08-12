import { ReloadOutlined } from "@ant-design/icons";
import { Button, message, Table, Tag, Typography } from "antd";
import { ColumnsType } from "antd/lib/table";
import { useEffect, useState } from "react";
import { IpcResponse } from "../../../shared/ipc/types";
import { useIpc } from "../../hooks/useIpc";

const { Text } = Typography;

interface DataType {
  key: string;
  id: string;
  ip: string;
  manufacturer: string;
}

const manufacturers = {
  "<HIKV>": {
    name: "Hikvision",
    color: "red",
  },
  "<ITBF>": {
    name: "Intelbras",
    color: "green",
  },
};

function toTag(manufacturer) {
  const manufacturerInfo = manufacturers[manufacturer];

  if (!manufacturerInfo) {
    return <></>;
  }

  return (
    <Tag color={manufacturerInfo.color} key={manufacturer}>
      {manufacturerInfo.name}
    </Tag>
  );
}

const columns: ColumnsType<DataType> = [
  {
    title: "Identificação",
    dataIndex: "id",
    key: "id",
    render: (text) => (text.length > 14 ? `${text.slice(0, 14)}...` : text),
  },
  {
    title: "Endereço IP",
    dataIndex: "ip",
    key: "ip",
    render: (text) => <Text copyable>{text}</Text>,
  },
  {
    title: "Fabricante",
    key: "manufacturer",
    dataIndex: "manufacturer",
    render: (_, { manufacturer }) => <>{toTag(manufacturer)}</>,
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

  async function loadHardwares(): Promise<IpcResponse> {
    const response = await ipc.send("hardware_find_all");

    setHardwares(response.data || hardwares);

    return response;
  }

  async function handleReload() {
    await message.loading("Buscando dispositivos");

    const response = await loadHardwares();

    showMessage(response);
  }

  useEffect(() => {
    loadHardwares();
  }, []);

  return (
    <>
      <Button
        type="link"
        shape="circle"
        icon={<ReloadOutlined />}
        loading={false}
        size="small"
        onClick={handleReload}
      >
        Buscar dispositivos
      </Button>
      <Table
        showHeader={false}
        columns={columns}
        dataSource={hardwares}
        pagination={false}
      />
    </>
  );
}
