import { EasyMina } from './../src/EasyMina.mjs'

const easymina = new EasyMina()
const result = easymina
    .init()
    // .getContracts()
     // .getDevelopmentContracts()
     // .getDeployedContracts()
await easymina
    .createAccounts( {
        'names': [ 'aaa' ],
        'groupName': 'check'
    } )
    
await easymina
    .getAccount( {
        'name': 'aaa',
        'groupName': 'check'
    } )


console.log( 'r', result )