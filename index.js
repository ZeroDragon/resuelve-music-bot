const Discord = require('discord.js')
const ytdl = require('ytdl-core')
const ytSearch = require('youtube-search')
const { prefix, token, googleKey } = require('./config.json')

const client = new Discord.Client()
const queue = new Map()

const searchOpts = { maxResults: 9, key: googleKey }

client.once('ready', () => {
  console.log('Ready!')
})

client.once('reconnecting', () => {
  console.log('Reconnecting!')
})

client.once('disconnect', () => {
  console.log('Disconnect!')
})

client.on('message', async message => {
  if (message.author.bot) return
  const r = new RegExp(/^[1-9|c]/, 'i')
  if (r.test(message.content)) return search2ndstep(message)
  if (!message.content.startsWith(prefix)) return

  const serverQueue = queue.get(message.guild.id)

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue)
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue)
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue)
  } else if (message.content.startsWith(`${prefix}search`)) {
    search(message)
  } else if (message.content.startsWith(`${prefix}queue`)) {
    queueList(message, serverQueue)
  } else {
    message.channel.send(`
\`\`\`markdown
Instrucciones  
=============  
- ${prefix}search
- ${prefix}play <link a video de youtube>
- ${prefix}skip
- ${prefix}stop
- ${prefix}queue
\`\`\`
    `)
  }
})

async function execute (message, serverQueue) {
  const args = message.content.split(' ')

  const voiceChannel = message.member.voiceChannel
  if (!voiceChannel) return message.channel.send('Necesitas estar en un canal de voz primero')
  const permissions = voiceChannel.permissionsFor(message.client.user)
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.channel.send('Necesito permisos para entrar y poner música en ese canal')
  }

  const songInfo = await ytdl.getInfo(args[1])
  const song = {
    title: songInfo.title,
    url: songInfo.video_url
  }

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    }

    queue.set(message.guild.id, queueContruct)
    queueContruct.songs.push(song)

    try {
      var connection = await voiceChannel.join()
      queueContruct.connection = connection
      play(message.guild, queueContruct.songs[0])
    } catch (err) {
      console.log(err)
      queue.delete(message.guild.id)
      return message.channel.send(err)
    }
  } else {
    serverQueue.songs.push(song)
    // console.log(serverQueue.songs)
    return message.channel.send(`${song.title} agregado`)
  }
}

const conversations = {}
function search2ndstep (message) {
  if (!conversations[message.author.id]) return
  if (message.content.startsWith('c')) {
    delete conversations[message.author.id]
    return
  }
  const index = ~~message.content[0]
  const item = conversations[message.author.id][index]
  const serverQueue = queue.get(message.guild.id)
  message.content = `!play ${item.link}`
  execute(message, serverQueue)
  delete conversations[message.author.id]
}
function search (message) {
  const query = message.content.replace(`${prefix}search `, '')
  ytSearch(query, searchOpts, function (err, results) {
    if (err) {
      console.log(err)
      return message.channel.send('Error en búsqueda :(')
    }
    const videos = results.map(res => {
      return {
        id: res.id,
        link: res.link,
        title: res.title
      }
    })
    conversations[message.author.id] = [+new Date(), ...videos]
    const codeQuotes = '```'
    message.channel.send(
      'Selecciona una opción del `1` al `9` o `c` para cancelar' +
      codeQuotes + 'css\n' +
      videos.map((v, k) => {
        return `${k + 1} ${v.title}  `
      }).join('\n') +
      '\nc Cancelar\n' +
      codeQuotes
    )
  })
}

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

function play (guild, song) {
  const serverQueue = queue.get(guild.id)

  if (!song) {
    serverQueue.voiceChannel.leave()
    queue.delete(guild.id)
    return
  }

  const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
    .on('end', () => {
      // console.log('Music ended!')
      serverQueue.songs.shift()
      play(guild, serverQueue.songs[0])
    })
    .on('error', error => {
      console.error(error)
    })
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
}

client.login(token)
