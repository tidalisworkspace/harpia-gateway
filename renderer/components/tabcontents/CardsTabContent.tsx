import { Space, Timeline, Typography } from "antd";
import { useState } from "react";
import { useIpcRenderer } from "../../hooks/useIpcRenderer";

const { Text } = Typography;
const { Item: Dot } = Timeline;

export default function CardsTabContent() {
  const ipcRenderer = useIpcRenderer();
  const [cards, setCards] = useState([]);

  ipcRenderer.listen("cards_content_add", (response) => {
    setCards([response.data, ...cards].slice(0, 12));
  });

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
