const express = require('express')
import {router} from './router/router'




const app = express()

app.use(express.json())
app.use(router)

app.listen(4000, (err:any):void=>{
    if(err) throw err
    console.log('Listening port 4000');
})
