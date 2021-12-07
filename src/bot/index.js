const axios = require('axios')
const pdKeyring = require('@polkadot/keyring')
const { formatBalance } = require('@polkadot/util')
require('dotenv').config()

// const matrixBot = require('./matrix')
const telegramBot = require('./telegram')

const SYMBOL = process.env.SYMBOL || 'SETM'
const DECIMALS = parseInt(process.env.DECIMALS) || 18
const EXPLORER_URL =
  process.env.EXPLORER_URL || 'https://console.setheum.xyz/explorer'
const AMOUNT = parseFloat(process.env.AMOUNT) || 0.18

let ax = axios.create({
  baseURL: process.env.BACKEND_URL,
  timeout: 10000,
})

const ghost = {
  async balance(bot) {
    const res = await ax.get('/balance')
    const balance = res.data
    const formattedAmount = formatBalance(balance, {
      forceUnit: '-',
      withUnit: SYMBOL,
      withSi: true,
      decimals: DECIMALS,
    })
    bot.sendMessage(`The faucet has ${formattedAmount} remaining.`)
  },
  async drip(bot, args) {
    try {
      pdKeyring.decodeAddress(args[0])
    } catch (e) {
      bot.sendMessage(
        `${bot.sender} provided an incompatible address (${args[0]}).`
      )
      return
    }

    let amount = AMOUNT
    if (bot.sender.endsWith(':setheum.xyz') && args[1]) {
      amount = args[1]
    }

    const res = await ax.post('/bot-endpoint', {
      sender: bot.sender,
      address: args[0],
      amount,
    })

    if (res.data === 'LIMIT') {
      bot.sendMessage(
        `${bot.sender} has reached their daily quota. Only request twice per 24 hours.`
      )
      return
    }

    const formattedAmount = formatBalance(amount * 10 ** DECIMALS, {
      forceUnit: '-',
      withUnit: SYMBOL,
      withSi: true,
      decimals: DECIMALS,
    })
    bot.sendHtmlMessage(
      `Sent ${bot.sender} ${formattedAmount}. <a href="${EXPLORER_URL}/${res.data}">View on explorer.</a>`,
      `Sent ${bot.sender} ${formattedAmount}. Extrinsic hash: ${res.data}.`
    )
  },
  async help(bot) {
    const t = bot.formatCommand
    bot.sendHtmlMessage(
      `Usage:
  <strong>${t(
    'drip'
  )} <i>[Address]</i></strong> - Send ${SYMBOL}s to <i>[Address]</i>.
  <strong>${t('balance')}</strong> - Get the faucet's balance.
  <strong>${t('help')}</strong> - Prints usage information.`,
      `Usage:
  ${t('drip')} <Address> - Send ${SYMBOL}s to <Address>.
  ${t('balance')} - Get the faucet's balance.
  ${t('help')} - Prints usage information.`
    )
  },
}

// matrixBot.start(ghost)
telegramBot.start(ghost)
