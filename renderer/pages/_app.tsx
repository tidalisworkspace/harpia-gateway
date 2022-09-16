import "antd/dist/antd.css";
import type { AppProps } from "next/app";
import ptBR from "antd/lib/locale/pt_BR";
import { ConfigProvider } from "antd";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider locale={ptBR}>
      <Component {...pageProps} />
    </ConfigProvider>
  );
}

export default MyApp;
