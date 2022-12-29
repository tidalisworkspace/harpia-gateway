import { Space, Timeline, Typography } from "antd";
import { useState } from "react";
import { CARDS_CONTENT_ADD } from "../../../shared/constants/ipc-renderer-channels.constants";
import { IpcMessage } from "../../../shared/ipc/types";
import { useIpcRenderer } from "../../hooks/useIpcRenderer";

const { Text } = Typography;
const { Item: Dot } = Timeline;

export default function CardsTabContent() {
  const ipcRenderer = useIpcRenderer();
  const [cards, setCards] = useState([]);

  function addCardsListener(message: IpcMessage) {
    setCards([message.data, ...cards].slice(0, 12));
  }

  ipcRenderer.addHandler(CARDS_CONTENT_ADD, addCardsListener);

  return (
    <Space direction="vertical" size="middle">
      {cards.length ? (
        <Text strong>Exibindo os últimos cartões lidos</Text>
      ) : (
        <Text strong>Nenhum cartão lido</Text>
      )}
      <Timeline>
        {cards.map((card) => (
          <Dot>
            <Text code>{card.timestamp}</Text>
            <Text copyable>{card.code}</Text>
          </Dot>
        ))}
      </Timeline>
    </Space>
  );
}
