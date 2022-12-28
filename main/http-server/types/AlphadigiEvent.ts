export interface Timeval {
  sec: number;
}

export interface PlateResultTimeStamp {
  Timeval: Timeval;
}

export interface PlateResult {
  confidence: number;
  license: string;
  timeStamp: PlateResultTimeStamp;
}

export interface AlarmInfoPlateResult {
  PlateResult: PlateResult;
}

export interface AlarmInfoPlate {
  ipaddr: string;
  result: AlarmInfoPlateResult;
}

export default interface AlphadigiEvent {
  logId: string;
  AlarmInfoPlate: AlarmInfoPlate;
}
