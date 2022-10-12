const {ensureAuth}=require('./auth')
const {findRandomUsers}=require('./populationUtil')

module.exports= {
    sideBarMiddlewares:[ensureAuth,findRandomUsers]

}