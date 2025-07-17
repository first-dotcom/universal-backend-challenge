import { networkInterfaces } from 'os';

export const getIp = (): string => {
  const interfaces = networkInterfaces();
  for (const key in interfaces) {
    const nets = interfaces[key];
    if (nets) {
      for (const net of nets) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
};