export const enum Level {
  EMERGENCY,
  ALERT,
  CRITICAL,
  ERROR,
  WARNING,
  NOTICE,
  INFO,
  DEBUG,
}

export type IDefaultOptions = {
  host?: string;
  tag?: string;
  level?: Level;
};

export type IGelfOptions = {
  port: number;
  host: string;
  defaults?: IDefaultOptions;
};

export type IGelfMeta = {
  level?: Level;
  host?: string;
  tag?: string;
  line?: number;
  facility?: string;
};

export type IGelfMessage = {
  short_message: string;
  full_message?: string;
};
