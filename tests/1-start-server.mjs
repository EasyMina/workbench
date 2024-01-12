import { EasyMina } from './../src/EasyMina.mjs'

const easymina = new EasyMina()
easymina
    .init()
    .startServer( { 'projectName': 'hello' } )