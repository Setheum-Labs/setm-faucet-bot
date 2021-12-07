const express = require('express')
const bodyParser = require('body-parser')
require('dotenv').config()

const Actions = require('./actions.js')

const Storage = require('./storage.js')
const storage = new Storage()

const app = express()
app.use(bodyParser.json())
const port = parseInt(process.env.PORT) || 5555

const mnemonic = process.env.MNEMONIC
const whitelistUserSuffix = process.env.WHITELISTED_USER_SUFFIX

app.get('/health', (_, res) => {
  res.send('Faucet backend is healthy.')
})

const createAndApplyActions = async () => {
  const actions = new Actions()
  await actions.create(mnemonic)

  app.get('/balance', async (_, res) => {
    const balance = await actions.checkBalance()
    res.send(balance.toString())
  })

  app.post('/bot-endpoint', async (req, res) => {
    const { address, amount, sender } = req.body

    if (
      !(await storage.isValid(sender, address)) &&
      !sender.endsWith(whitelistUserSuffix)
    ) {
      res.send('LIMIT')
      return
    }

    storage.saveData(sender, address)

    const hash = await actions.sendDOTs(address, amount)
    res.send(hash)
  })

  app.post('/web-endpoint', () => {})
}

const main = async () => {
  await createAndApplyActions()
  const server = app.listen(port, () =>
    console.log(`Faucet backend listening on port ${port}.`)
  )
  await new Promise((_, reject) => {
    server.on('error', reject)
  })
}

main()
  .catch(console.error)
  .finally(() => process.exit())
