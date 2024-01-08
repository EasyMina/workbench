import { EasyMina } from '../../../src/EasyMina.mjs'

console.log( '- Add EasyMina' )
const easyMina = new EasyMina()
easyMina.init()

console.log( '- Create Account' )
const deployer = await easyMina
    .createAccounts( {
        'name': 'alice',
        'groupName': 'group-a',
        'networkName': 'berkeley'
    } )

console.log( 'deployer', deployer )