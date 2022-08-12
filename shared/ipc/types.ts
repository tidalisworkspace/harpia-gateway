export interface IpcRequest {
  responseChannel?: string;
  params?: any;
}

export interface IpcResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

export type IpcMainChannel =
  | "logger_file_open"
  | "logger_file_clean"
  | "logger_file_size"
  | "hardware_find_all"
  | "database_connection_status"
  | "database_test_connection"
  | "database_update_connection"
  | "socket_connections_amount";

export type IpcRendererChannel =
  | "settings_tab_dot"
  | "cards_content_add"
  | "socket_connections_change"
  | "database_connection_change"
  | "logger_file_size_change";
