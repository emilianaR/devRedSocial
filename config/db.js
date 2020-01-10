const moongoose = require('mongoose')
const config = require('config')
const db = config.get('mongoURI')

const connectDB = async () => {
    try {
        await moongoose.connect(db,
            {
                useUnifiedTopology: true,
                useNewUrlParser: true,
                useCreateIndex: true
            });
        console.log('connected to db');
    } catch (err) {
        console.log(err);
    }
}

module.exports = connectDB