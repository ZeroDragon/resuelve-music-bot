const ytSearch = require('youtube-search')
const { prefix, googleKey } = require('../config')
const { queueContructor } = require('./queueContructor')

const searchOpts = { maxResults: 9, key: googleKey, type: 'video' }
const conversations = {}

const search2ndstep = (message) => {
  if (!conversations[message.author.id]) return
  if (message.content.startsWith('c')) {
    delete conversations[message.author.id]
    return
  }
  const index = ~~message.content[0]
  const item = conversations[message.author.id][index]
  const serverQueue = global.queue.get(message.guild.id)
  message.content = `!play ${item.link}`
  queueContructor(message, serverQueue)
  delete conversations[message.author.id]
}

const search = message => {
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
    message.channel.send(
      'Selecciona una opción del `1` al `9` o `c` para cancelar' +
      '```' + 'css\n' +
      videos.map((v, k) => {
        return `${k + 1} ${v.title}  `
      }).join('\n') +
      '\nc Cancelar\n' +
      '```'
    )
  })
}

module.exports = {
  search,
  search2ndstep
}
