const mSDK = require('matrix-js-sdk')

// const BOT_ID = process.env.MATRIX_USER_ID || '@westend_faucet:matrix.org'

const mbot = mSDK.createClient({
  baseUrl: 'https://matrix.org',
  accessToken: process.env.MATRIX_ACCESS_TOKEN,
  userId: process.env.MATRIX_USER_ID,
  localTimeoutMs: 10000,
})

exports.start = function (ghost) {
  // Temporarily disabled:
  // mbot.on('RoomMember.membership', (_, member) => {
  //   if (member.membership === 'invite' && member.userId === BOT_ID) {
  //     mbot.joinRoom(member.roomId).done(() => {
  //       console.log(`Auto-joined ${member.roomId}.`);
  //     });
  //   }
  // });

  mbot.on('Room.timeline', async (event) => {
    if (event.getType() !== 'm.room.message') {
      return // Only act on messages (for now).
    }

    if (!event.event.content || !event.event.content.body) {
      return
    }
    const {
      content: { body },
      // event_id: eventId,
      room_id: roomId,
      sender,
    } = event.event
    console.warn(roomId, sender, body)

    const bot = {
      formatCommand(cmd) {
        return `!${cmd}`
      },
      sender,
      async sendMessage(msg) {
        mbot.sendTextMessage(roomId, msg)
      },
      async sendHtmlMessage(htmlMsg, msg) {
        const fixedHtmlMsg = htmlMsg.replace(/\n/g, '<br>')
        await mbot.sendHtmlMessage(roomId, msg, fixedHtmlMsg)
      },
    }

    const cmds = body.split(' ').map((s) => s.trim())
    if (!cmds || !cmds[0].startsWith('!')) return

    const cmd = cmds[0].slice(1)
    const args = cmds.slice(1)

    if (cmd in ghost) {
      await ghost[cmd](bot, args)
    } else {
      console.log('Matrix bot: unknown cmd', cmd, args)
    }
  })

  mbot.startClient(0)
}
