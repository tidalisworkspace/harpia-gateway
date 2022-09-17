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
import { IpcResponse } from "../../../../shared/ipc/types";
import { useIpc } from "../../../hooks/useIpc";
import Status from "../../Status";

function ConnectionStatus() {
  const ipc = useIpc();
  const [type, setType] = useState("loading");

  const types = {
    connected: <Status title="Conexão" text="Conectado" success />,
    disconnected: <Status title="Conexão" text="Desconectado" failed />,
    loading: <Status title="Conexão" text="Carregando" loading />,
    error: <Status title="Conexão" text="Erro" failed />,
  };

  ipc.listen("database_connection_change", (response) =>
    setType(response.data)
  );

  useEffect(() => {
    ipc
      .send("database_connection_status")
      .then((response) => setType(response.data || "error"));
  }, []);

  return types[type];
};

function showMessage(response: IpcResponse) {
  if (!response.message) {
    return;
  }

  message[response.status](response.message);
}

export default function DatabasePanelContent() {
  const ipc = useIpc();
  const [form] = Form.useForm();

  function testDatabaseConnection(params: any): Promise<IpcResponse> {
    return ipc.send("database_test_connection", { params });
  }

  function updateDatabaseConnection(params: any): Promise<IpcResponse> {
    return ipc.send("database_update_connection", { params });
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
