import { environment as devEnv } from "./environment";

export const environment = {
  production: true,
  /** not used in production, but necessary to prevent error */
  emulatorPorts: devEnv.emulatorPorts,
};
