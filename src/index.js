const Discord = require('discord.js')
const { prefix, token } = require('../config')
const { search, search2ndstep } = require('./search')
const { queueContructor } = require('./queueContructor')

global.client = new Discord.Client()
global.queue = new Map()

global.client.once('ready', () => {
  console.log('Ready!')
})

global.client.once('reconnecting', () => {
  console.log('Reconnecting!')
})

global.client.once('disconnect', () => {
  console.log('Disconnect!')
})

global.client.on('message', async message => {
  if (message.author.bot) return
  const r = new RegExp(/^[1-9|c]/, 'i')
  if (r.test(message.content)) return search2ndstep(message)
  if (!message.content.startsWith(prefix)) return

  const serverQueue = global.queue.get(message.guild.id)

  if (message.content.startsWith(`${prefix}play`)) {
    queueContructor(message, serverQueue)
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue)
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue)
  } else if (message.content.startsWith(`${prefix}search`)) {
    search(message)
  } else if (message.content.startsWith(`${prefix}queue`)) {
    queueList(message, serverQueue)
  } else {
    message.channel.send(
      [
        '```markdown',
        'Instrucciones',
        '=============',
        `- ${prefix}search`,
        `- ${prefix}play < link a video de youtube >`,
        `- ${prefix}skip`,
        `- ${prefix}stop`,
        `- ${prefix}queue`
      ].join('\n')
    )
  }
})

function queueList (message, serverQueue) {
  let response
  if (!serverQueue) {
    response = 'No hay elementos en la lista de reproducción'
  } else {
    response = '```css\n' +
    serverQueue.songs.map((e, i) => `${i + 1} ${e.title}`).join('\n') +
    '\n```'
  }
  return message.channel.send(response)
}

function skip (message, serverQueue) {
  if (!message.member.voiceChannel) return message.channel.send('Necesitas estar en un canal de voz')
  if (!serverQueue) return message.channel.send('Kha?')
  serverQueue.connection.dispatcher.end()
}

function stop (message, serverQueue) {
  if (!message.member.voiceChannel) return message.channel.send('Necesitas estar en un canal de voz')
  serverQueue.songs = []
  serverQueue.connection.dispatcher.end()
}

global.client.login(token)
