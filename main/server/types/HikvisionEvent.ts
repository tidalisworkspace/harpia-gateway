interface AccessControllerEvent {
  majorEventType: number;
  subEventType: number;
  cardNo: string;
  employeeNoString: string;
}

export default interface HikvisionEvent {
  ipAddress: string;
  dateTime: string;
  AccessControllerEvent: AccessControllerEvent;
}
