export const environment = {
  production: true,
  /** not used in production, but necessary to prevent error */
  emulatorPorts: {
    auth: 9099,
    functions: 5001,
    firestore: 8080,
    database: 9000,
    storage: 9199,
  },
};
