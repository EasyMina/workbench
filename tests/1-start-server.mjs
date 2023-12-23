import { EasyMina } from './../src/EasyMina.mjs'

const easymina = new EasyMina()
easymina
    .init()
    .setProjectName( 'hello-world' )
    .server()