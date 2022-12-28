export interface ObjectChangeValues {
  id: string;
  time: string;
  event: string;
  device_id: string;
  indentifier_id: string;
  user_id: string;
  portal_id: string;
  identification_rule_id: string;
  card_value: string;
  log_type_id: string;
}

export interface ObjectChange {
  object: string;
  type: string;
  values: ObjectChangeValues;
}

export default interface ControlIdEvent {
  logId: string;
  ip: string;
  device_id: number;
  object_changes: ObjectChange[];
}
