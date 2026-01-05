export {};

interface TestConfig {
  useRealDatabase: boolean;
  useRealAPIs: boolean;
  disableMocks: boolean;
  databaseUrl?: string;
}

interface Gapi {
  load: (api: string, callback: { callback?: () => void }) => void;
  client: {
    init: () => Promise<void>;
    docs: {
      documents: {
        create: (...args: unknown[]) => Promise<unknown>;
        get: (...args: unknown[]) => Promise<unknown>;
        batchUpdate: (...args: unknown[]) => Promise<unknown>;
      };
    };
  };
  auth2: {
    getAuthInstance: () => {
      isSignedIn: { get: () => boolean };
      currentUser: { get: () => { getAuthResponse: () => { access_token: string } } };
    };
  };
}

interface GoogleAccounts {
  accounts: {
    oauth2: {
      initTokenClient: (...args: unknown[]) => { requestAccessToken: () => void };
    };
  };
}

declare global {
  var testConfig: TestConfig;
  var gapi: Gapi;
  var google: GoogleAccounts;
}
