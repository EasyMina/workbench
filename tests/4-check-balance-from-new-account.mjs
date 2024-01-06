import { EasyMina } from './../src/EasyMina.mjs'

const easymina = new EasyMina()
const result = easymina.init()
    // .getContracts()
     // .getDevelopmentContracts()
     // .getDeployedContracts()

/*
await easymina
    .createAccounts( {
        'names': [ 'aaa' ],
        'groupName': 'check',
        'networkName': 'berkeley'
    } )
*/

/*
await easymina
    .createAccount( {
        'name': 'test',
        'groupName': 'checkking',
        'networkName': 'berkeley'
    } )
*/

const struct = {
    'name': 'abc',
    'groupName': 'try',
    'networkName': 'berkeley'
} 

console.log( 'Create Account' )
await easymina.createAccount( struct )
console.log( 'Get Account' )
const account = await easymina.getAccount( struct )
console.log( account )
