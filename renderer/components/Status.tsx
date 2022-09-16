import {
  LoadingOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Space, Typography } from "antd";

const { Text } = Typography;

const statusNames = ["loading", "success", "failed"];

const statusOptions = {
  loading: {
    variant: "secondary",
    icon: <LoadingOutlined />,
  },
  success: {
    variant: "success",
    icon: <PlayCircleOutlined />,
  },
  failed: {
    variant: "danger",
    icon: <StopOutlined />,
  },
};

function getOptions(props) {
  for (const statusName of statusNames) {
    if (props[statusName]) {
      return statusOptions[statusName];
    }
  }

  return statusOptions.loading;
}

export default function Status(props) {
  const options = getOptions(props);

  return (
    <Space>
      {`${props.title || "Status"}:`}
      <Text type={options.variant}>
        {props.text} {options.icon}
      </Text>
    </Space>
  );
}
