export interface IpcRequest {
  responseChannel?: string;
  params?: any;
}

export type IpcResponseStatus = "success" | "error";

export interface IpcResponse {
  status: IpcResponseStatus;
  message?: string;
  data?: any;
}

export type IpcRendererChannel =
  | "settings_tab_dot"
  | "cards_content_add"
  | "socket_connections_change"
  | "database_connection_change"
  | "logger_file_size_change";

export interface HardwareAddress {
  ip: string;
  port: number;
}

export interface HardwareCommandIpcRequest extends IpcRequest {
  params?: HardwareAddress[];
}
