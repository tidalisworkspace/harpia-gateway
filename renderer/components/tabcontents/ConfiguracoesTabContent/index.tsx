import DatabaseConnectionSection from "./DatabaseConnectionSection";
import LogsSection from "./LogsSection";
import SocketSection from "./SocketSection";

export default function ConfiguracoesTabContent() {
  return (
    <>
      <LogsSection />
      <DatabaseConnectionSection />
      <SocketSection />
    </>
  );
}
