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

export type IpcMainChannel =
  | "logger_file_open"
  | "logger_file_clean"
  | "logger_file_size"
  | "hardware_find_all"
  | "hardware_reboot"
  | "hardware_update_datetime"
  | "hardware_configure_events_server"
  | "hardware_test_connection"
  | "database_connection_status"
  | "database_test_connection"
  | "database_update_connection"
  | "socket_connections_amount"
  | "socket_port"
  | "socket_state"
  | "http_ip"
  | "http_port"
  | "http_state";

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
