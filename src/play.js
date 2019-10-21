const ytdl = require('ytdl-core')

const play = (message, song) => {
  const { guild } = message
  const serverQueue = global.queue.get(guild.id)

  if (!song) {
    serverQueue.voiceChannel.leave()
    global.queue.delete(guild.id)
    return
  }

  const stream = ytdl(song.url, {
    filter: 'audioonly',
    quality: 'highestaudio'
  })
  const dispatcher = serverQueue.connection.playStream(stream)
    .on('end', () => {
      global.client.user.setPresence({ game: { name: 'nada :(' } })
      serverQueue.songs.shift()
      play(message, serverQueue.songs[0])
    })
    .on('error', error => {
      console.error(error)
    })
    .on('start', () => {
      global.client.user.setPresence({ game: { name: song.title } })
      message.channel.send(`Ahora escuchamos ${song.title}`)
    })
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
}

module.exports = {
  play
}
