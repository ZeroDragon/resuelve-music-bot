const ytdl = require('ytdl-core')
const { play } = require('./play')

async function queueContructor (message, serverQueue) {
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

    global.queue.set(message.guild.id, queueContruct)
    queueContruct.songs.push(song)

    try {
      var connection = await voiceChannel.join()
      queueContruct.connection = connection
      play(message, queueContruct.songs[0])
    } catch (err) {
      console.log(err)
      global.queue.delete(message.guild.id)
      return message.channel.send(err)
    }
  } else {
    serverQueue.songs.push(song)
    // console.log(serverQueue.songs)
    return message.channel.send(`${song.title} agregado`)
  }
}

module.exports = {
  queueContructor
}
