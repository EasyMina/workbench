import { EasyMina } from './../src/EasyMina.mjs'

const easyMina = new EasyMina()
easyMina
    .init()
    .setAccountGroup( 'test-berkeley' )
    .setProjectName( 'ABC-Project' ) 

await easyMina.newPersonas( { 
    names: [ 'alice', 'bob', 'cetris' ]
} ) 

/*
easyMina
    .setAccountGroup( 'group-c' )

await easyMina.newPersonas( { 
    names: [ 'zilly' ]
} ) 
*/