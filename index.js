let express = require('express');
let app = express();
let port = process.env.PORT || 3000 ;

app.set('view engine', 'ejs');

app.get('/',(req,res) => {
    res.json({msg: "home"})
})

app.get('/page',(req,res) => {
    res.json({msg: "page"})
})

app.listen(port, () => {
    console.log(`server start on port ${port}`)
})