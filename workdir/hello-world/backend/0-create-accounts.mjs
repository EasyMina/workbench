import { EasyMina } from '../../../src/EasyMina.mjs'

console.log( '- Add EasyMina' )
const easyMina = new EasyMina()
easyMina.init()

console.log( '- Create Accounts' )
const deployer = await easyMina
    .createAccounts( {
        'names': [ 'alice', 'bob', 'charles' ],
        'groupName': 'group-a',
        'networkName': 'berkeley'
    } )

console.log( 'deployer', deployer )