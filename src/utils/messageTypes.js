// messageTypes.js
export const ACTIONS = {
  CLIENT_PUBLIC_KEY: 'client-public-key',
  CLIENT_HELLO: 'client-hello',
  CLIENT_SEND: 'client-send',

  ENCRYPTED: 'encrypted',

  GROUP_BROADCAST: 'gbroadcast',
  GROUP_BAN: 'ban',
  GROUP_ACTION: 'gactions',

  SERVER_INIT: 'server-init',
  SERVER_RECEIVED_KEY: 'server-received-key',
  SERVER_FORWARD: 'server-forward',
  SERVER_GROUP_BROADCAST: 'server-group-broadcast',
  SERVER_ERROR: 'server-error',
  SERVER_NOTIFY_ME: 'server-error-me',
  SERVER_NOTIFY: 'server-notify',
  SERVER_NOTIFY_GROUP_ACTION: 'server-notify-group-action',
};
