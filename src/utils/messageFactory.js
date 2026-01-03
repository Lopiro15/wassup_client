// messageFactory.js
import { ACTIONS } from './messageTypes.js';

export const createClientHello = () => ({
  action: ACTIONS.CLIENT_HELLO
});

// Ajouter de nouvelles actions pour l'authentification
export const createClientLogin = (login, password) => ({
  login,
  password,
  action: ACTIONS.CLIENT_LOGIN
});

export const createClientRegister = (username, password) => ({
  username,
  password,
  action: ACTIONS.CLIENT_REGISTER
});

export const createClientPublicKey = (publicKey) => ({
  publicKey,
  action: ACTIONS.CLIENT_PUBLIC_KEY
});

export const createClientSend = (sender, dest, msg) => ({
  sender,
  dest,
  msg,
  action: ACTIONS.CLIENT_SEND
});

export const createClientBroadcast = (sender, msg) => ({
  sender,
  msg,
  action: ACTIONS.CLIENT_BROADCAST
});

export const createClientListRequest = (sender) => ({
  sender,
  action: ACTIONS.CLIENT_LIST_CLIENTS
});

export const createClientQuit = (sender) => ({
  sender,
  action: ACTIONS.CLIENT_QUIT
});


export const createQuit = (sender) => ({
  sender,
  action: ACTIONS.QUIT
});

// Groups commands

export const createClientGroupCreate = (sender, group_name) => ({
  sender,
  group_name,
  action: ACTIONS.GROUP_CREATE
});

export const createClientGroupJoin = (sender, group_name) => ({
  sender,
  group_name,
  action: ACTIONS.GROUP_JOIN
});

export const createClientGroupBroadcast = (sender, group_name, msg) => ({
  sender,
  group_name,
  msg,
  action: ACTIONS.GROUP_BROADCAST
});


export const createClientGroupListMember = (sender, group_name) => ({
  sender,
  group_name,
  action: ACTIONS.GROUP_LIST_MEMBERS
});

export const createClientGroupListMessages = (sender, group_name) => ({
  sender,
  group_name,
  action: ACTIONS.GROUP_LIST_MESSAGES
});


export const createClientGroupList = (sender) => ({
  sender,
  action: ACTIONS.GROUP_LIST
});

export const createClientGroupLeave = (sender, group_name) => ({
  sender,
  group_name,
  action: ACTIONS.GROUP_LEAVE
});

export const createClientGroupInvite = (sender, group_name, dest) => ({
  sender,
  group_name,
  dest,
  action: ACTIONS.GROUP_INVITE
});


export const createClientGroupKick = (sender, group_name, dest, reason) => ({
  sender,
  group_name,
  dest,
  reason,
  action: ACTIONS.GROUP_KICK
});

export const createClientGroupBan = (sender, group_name, dest, reason) => ({
  sender,
  group_name,
  dest,
  reason,
  action: ACTIONS.GROUP_BAN
});

export const createClientGroupUnban = (sender, group_name, dest) => ({
  sender,
  group_name,
  dest,
  action: ACTIONS.GROUP_UNBAN
});

export const createClientGroupStates = (sender, group_name) => ({
  sender,
  group_name,
  action: ACTIONS.GROUP_STATS
});


