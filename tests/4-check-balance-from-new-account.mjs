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
    'name': 'andreas',
    'groupName': 'try',
    'networkName': 'berkeley',
    'checkStatus': true,
    'strict': false
} 

console.log( 'Create Account' ) 
await easymina.createAccount( struct )
console.log( 'Get Account' )
const cred = await easymina.getAccount( struct )
// console.log( 'cred', cred )
