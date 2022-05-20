const fs = require('fs');
const express = require('express')
const app = express()
const port = +process.argv[2] || 3000

const client = require('redis').createClient()
client.on('error', (err) => console.log('Redis Client Error', err));

client.on('ready', () => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Example app listening at http://0.0.0.0:${port}`)
    })
})

const cardsData = fs.readFileSync('./cards.json');
const cards = JSON.parse(cardsData).map(card => ({
    'str': JSON.stringify(card),
    'obj': card
}));

let pullCard = async (key) => {
    const userCardCount = await client.SCARD(key)
    if (userCardCount === cards.length) {
        return { id: "ALL CARDS" }
    }
    let missingCard = cards[userCardCount]
    let result = await client.SADD(key, missingCard.str)
    
    if (!result) {
        return pullCard(key)
    } else {
        return missingCard.obj
    }
}

app.get('/card_add', async (req, res) => {
    const key = 'user_id:' + req.query.id
    let missingCard = await pullCard(key)
    res.send(missingCard)
})

app.get('/ready', async (req, res) => {
    res.send({ready: true})
})

client.connect();
