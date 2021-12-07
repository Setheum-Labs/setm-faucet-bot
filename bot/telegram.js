const { Telegraf } = require('telegraf')
const HttpsProxyAgent = require('https-proxy-agent')

function setupProxy() {
  if (!process.env.http_proxy) {
    return {}
  }
  const proxy = process.env.http_proxy
  const agent = new HttpsProxyAgent(proxy)
  console.log(proxy)
  return { telegram: { agent } }
}

const tgbot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN, setupProxy())

function botForCtx(ctx) {
  return {
    formatCommand(cmd) {
      return `/${cmd}`
    },
    sender: ctx.from.username,
    async sendMessage(msg) {
      // await ctx.telegram.sendMessage(ctx.message.chat.id, msg);
      ctx.reply(msg)
    },
    async sendHtmlMessage(msg) {
      // await ctx.telegram.sendMessage(ctx.message.chat.id, msg, {parse_mode: 'HTML'});
      ctx.reply(msg, { parse_mode: 'HTML' })
    },
  }
}

exports.start = function (ghost) {
  for (const cmd in ghost) {
    tgbot.command(cmd, (ctx) => {
      const bot = botForCtx(ctx)
      const args = ctx.message.text
        .split(' ')
        .map((s) => s.trim())
        .slice(1)
      ghost[cmd](bot, args)
    })
  }

  tgbot.on('text', (ctx) => {
    const cmds = ctx.message.text.split(' ').map((s) => s.trim())
    console.log('chat type', ctx.chat.type)
    if (ctx.chat.type == 'group' || ctx.chat.type == 'supergroup') {
      if (cmds.length < 2) return
      const mention = cmds[0]
      if (mention != `@${ctx.botInfo.username}`) return
      cmds.shift()
    } else {
      if (!cmds) return
    }

    if (!cmds[0].startsWith('/')) return

    const cmd = cmds[0].substring(1)
    const args = cmds.slice(1)
    const bot = botForCtx(ctx)

    if (cmd in ghost) {
      ghost[cmd](bot, args)
    }
  })

  tgbot.start((ctx) => {
    const bot = botForCtx(ctx)
    ghost.faucet(bot)
  })
  tgbot.launch()
}
