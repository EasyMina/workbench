import { EasyMina } from './src/EasyMina.mjs'

const easyMina = new EasyMina()
easyMina
    .init()
    .setAccountGroup( 'group-a' )
    .setProjectName( 'ABC-Project' ) 


await easyMina.newPersonas( { 
    names: [ 'aaa', 'bbb' ], 
    groupName: 'testing' 
} )

