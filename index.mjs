import { EasyMina } from './src/EasyMina.mjs'

const easyMina = new EasyMina()
easyMina
    .init()
    .setAccountGroup( 'group-b' )
    .setProjectName( 'ABC-Project' ) 

await easyMina.newPersonas( { 
    names: [ 'zilly' ]
} ) 

easyMina
    .setAccountGroup( 'group-c' )

await easyMina.newPersonas( { 
    names: [ 'zilly' ]
} ) 