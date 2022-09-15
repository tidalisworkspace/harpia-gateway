import {
  CheckCircleFilled,
  LoadingOutlined,
  SaveFilled,
} from "@ant-design/icons";
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
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { IpcResponse } from "../../../../shared/ipc/types";
import { useIpc } from "../../../hooks/useIpc";

const { Text } = Typography;

const Status = (props) => (
  <Space>
    Status:
    <Text type={props.type}>
      {props.text} {props.loading ? <LoadingOutlined /> : <CheckCircleFilled />}
    </Text>
  </Space>
);

const DatabaseStatus = () => {
  const ipc = useIpc();
  const [status, setStatus] = useState(null);

  ipc.listen("database_connection_change", (response) =>
    setStatus(response.data)
  );

  useEffect(() => {
    ipc
      .send("database_connection_status")
      .then((response) => setStatus(response.data));
  }, []);

  if (status === "connected") {
    return <Status type="success" text="Conectado" />;
  }

  if (status === "disconnected") {
    return <Status type="danger" text="Desconectado" />;
  }

  return <Status type="secondary" text="Carregando" loading />;
};

function showMessage(response: IpcResponse) {
  if (!response.message) {
    return;
  }

  message[response.status](response.message);
}

export default function DatabaseConnectionPanelContent() {
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
      <DatabaseStatus />
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
                    Atualizar
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
