require('dotenv').config()
const express = require('express')
const app = express()
const session = require('express-session')
const flash = require('express-flash')
const passport = require('passport')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const expressLayouts = require('express-ejs-layouts')
const methodOverride = require('method-override')
const { createServer } = require('http')
const { Server } = require('socket.io')
const httpServer = createServer(app);
require('./config/passport_google')()
require('./config/passport_local')()
// connect mongoose
mongoose.connect(process.env.MONGO_URL).then(() => console.log('MongoDB is connected!')).catch(e => {
    console.error(e.message);
    process.nextTick(() => {
        throw Error(e)
    })
    // process.exit(1)
})
// express setup
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(express.json())
app.set('view engine', 'ejs')
app.use('*/css', express.static(__dirname + '/public/css'))
app.use('*/js', express.static(__dirname + '/public/js'))
app.use(express.static(__dirname + '/public'))
app.use(expressLayouts)
app.use(methodOverride('_method'))

// main layout
app.set('layout', 'layout/main')


//----- scoket io setup---------------
const io = new Server(httpServer)
require('./socket/serverSocket')(io)


//----------- express-session-setup---------------------------
app.use(session({
    secret: process.env.APP_SECRET,
    saveUninitialized: false,
    resave: true
}))
app.use(cookieParser())
//----- ----------------- PASSPORT SETUP ----------------------------
app.use(passport.initialize())
app.use(passport.session())
//--------------- FLASH MESSAGES SETUP-------------------------
app.use(flash())


//-------------MONGOOSE CHANGE STREAMS----------------------
require('./triggers/message')()
// require('./triggers/chat')(io)
require('./triggers/notification')(io)


// global variables for flash messages
app.use((req, res, next) => {
    res.locals.err_msg = req.flash('err_msg')
    res.locals.info_msg = req.flash('info_msg')
    res.locals.error = req.flash('error')
    res.locals.success_msg = req.flash('success_msg')
    next()
})

//--------------------------- API END POINTS------------------
//------------- API  for '@/api/posts' route---------------
app.use('/api/posts', (require('./api/posts')))
//------------- API  for '@/api/users' route---------------
app.use('/api/users', (require('./api/users')))
//------------- API  for '@/api/messages' route---------------
app.use('/api/messages', (require('./api/messages')))
//------------- API  for '@/api/notifications' route---------------
app.use('/api/notifications', (require('./api/notifications')))


//--------------- ROUTES END POINTS------------------------------
//------------- ROUTES for '@/' route---------------
app.use('/', require('./routes/index'))

//------------- ROUTES for '@/user' route---------------
app.use('/user', (require('./routes/user')))

//------------- ROUTES for '@/user/upload' route---------------
app.use('/user/upload', require('./routes/upload'))

//------------- ROUTES for '@/posts' route---------------
app.use('/posts', (require('./routes/posts')))

//------------- ROUTES for '@/search' route---------------
app.use('/search', (require('./routes/search')))

//------------- ROUTES for '@/messages' route---------------
app.use('/messages', (require('./routes/message')))

//------------- ROUTES for '@/notifications' route---------------
app.use('/notifications', (require('./routes/notifications')))

//---------- 404 page--------------------
app.get('*', (req, res) => res.status(404).render('error',
    {
        layout: 'layout/authLayout',
        path: '404',
        title: 'Not Found',
    }))


//-------------- GLOBAL ERROR HANDLER-----------------------------
app.use((error, req, res, next) => {
    if (error) {
        let code = error.statusCode || 500
        console.log(code)
        console.error(error)

        //show user something broken
        res.status(code).render('error', {
            layout: 'layout/authLayout',
            path: 'error',
            title: 'Something Broken',
        })
        return
    }
    next()
})


const port=process.env.PORT || 3000
httpServer.listen(port, () => console.log(`server is runing at port:${port}`));