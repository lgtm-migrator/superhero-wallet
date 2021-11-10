export default ({
  migrations,
  current,
  transactions: { pending },
  currencies,
  userNetworks,
  names,
  languages,
  nextCurrenciesFetch,
  tip,
  backedUpSeed,
  mnemonic,
  saveErrorLog,
  invites,
  notificationSettings,
  permissions,
  fungibleTokens,
  accounts: { list, activeIdx, hdWallet: { nextAccountIdx } = {} } = {},
  cardMinified,
}) => ({
  migrations,
  current,
  transactions: { pending, loaded: [] },
  currencies,
  userNetworks,
  names,
  languages,
  nextCurrenciesFetch,
  tip,
  backedUpSeed,
  mnemonic,
  saveErrorLog,
  invites,
  notificationSettings,
  permissions,
  fungibleTokens,
  accounts: { list, activeIdx, hdWallet: { nextAccountIdx } },
  cardMinified,
});
