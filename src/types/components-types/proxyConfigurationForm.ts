export interface ProxyTypes{
  isActive: boolean;
  host: string;
  protocol: "http"|"https";
  url: string;
  username: string;
  password: string;
  port: number;
}
export interface ProxyFormErrors{
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  url?: string;
  protocol?: string;
}
