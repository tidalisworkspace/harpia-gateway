import { SaveFilled } from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Input,
  message,
  Popconfirm,
  Radio,
  Row,
  Space,
} from "antd";
import { useEffect, useState } from "react";
import {
  DATABASE_CONNECTION_STATUS,
  DATABASE_CONNECTION_TEST,
  DATABASE_CONNECTION_UPDATE,
} from "../../../../shared/constants/ipc-main-channels.constants";
import { DATABASE_CONNECTION_CHANGE } from "../../../../shared/constants/ipc-renderer-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import { useIpcRenderer } from "../../../hooks/useIpcRenderer";
import Status from "../../Status";

function ConnectionStatus() {
  const ipcRenderer = useIpcRenderer();
  const [type, setType] = useState("loading");

  ipcRenderer.listen(DATABASE_CONNECTION_CHANGE, (response) =>
    setType(response.data)
  );

  const types = {
    loading: <Status title="Conexão" text="Carregando" loading />,
    success: <Status title="Conexão" text="Conectado" success />,
    error: <Status title="Conexão" text="Desconectado" failed />,
  };

  async function loadStatus() {
    const response = await ipcRenderer.request(DATABASE_CONNECTION_STATUS);
    setType(response.status);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  return types[type];
}

function showMessage(response: IpcResponse) {
  if (!response.message) {
    return;
  }

  message[response.status](response.message);
}

export default function DatabasePanelContent() {
  const ipcRenderer = useIpcRenderer();
  const [form] = Form.useForm();

  function testDatabaseConnection(params: any): Promise<IpcResponse> {
    return ipcRenderer.request(DATABASE_CONNECTION_TEST, { params });
  }

  function updateDatabaseConnection(params: any): Promise<IpcResponse> {
    return ipcRenderer.request(DATABASE_CONNECTION_UPDATE, { params });
  }

  async function handleSubmit() {
    await form.validateFields();

    const values = form.getFieldsValue();

    await message.loading("Testando conexão");

    let response = await testDatabaseConnection(values);

    showMessage(response);

    if (response.status !== "success") {
      return;
    }

    await message.loading("Atualizando dados de conexão");

    response = await updateDatabaseConnection(values);

    showMessage(response);
  }

  return (
    <>
      <ConnectionStatus />
      <Space style={{ marginTop: 10 }}>
        <Form
          form={form}
          name="basic"
          autoComplete="off"
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark
        >
          <Row>
            <Col>
              <Form.Item
                label="Dialeto"
                name="dialect"
                rules={[{ required: true, message: "Obrigatório" }]}
              >
                <Radio.Group>
                  <Radio value="mysql">MySQL</Radio>
                  <Radio value="postgres">Postgres</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={4}>
            <Col span={18}>
              <Form.Item
                label="Endereço"
                name="host"
                rules={[{ required: true, message: "Obrigatório" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Porta"
                name="port"
                rules={[{ required: true, message: "Obrigatório" }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={4}>
            <Col span={12}>
              <Form.Item
                label="Usuário"
                name="username"
                rules={[{ required: true, message: "Obrigatório" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Senha"
                name="password"
                rules={[{ required: true, message: "Obrigatório" }]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Item>
                <Popconfirm
                  title="Tem certeza que deseja atualizar?"
                  okText="Sim"
                  cancelText="Não"
                  onConfirm={handleSubmit}
                >
                  <Button
                    type="link"
                    shape="circle"
                    icon={<SaveFilled />}
                    htmlType="submit"
                  >
                    Salvar
                  </Button>
                </Popconfirm>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Space>
    </>
  );
}
