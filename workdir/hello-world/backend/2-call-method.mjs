import fs from 'fs'
import { Mina, Field, fetchAccount } from 'o1js'
import { EasyMina } from '../../../src/EasyMina.mjs'

console.log( '- Add Network' )
const Berkeley = Mina.Network( 
    // 'https://proxy.berkeley.minaexplorer.com/graphql' 
    'https://api.minascan.io/node/berkeley/v1/graphql'
)

Mina.setActiveInstance( Berkeley )
 
console.log( '- Add EasyMina' )
const easyMina = new EasyMina()
easyMina.init()

console.log( '- Import Account' )
const deployer = await easyMina
    .getAccount( {
        'name': 'alice',
        'groupName': 'group-a',
        // 'checkStatus': true,
        // 'strict': true
    } )
console.log( '   ', deployer['explorer'] )

console.log( '- Add Contract' )
const contract = await easyMina
    .getDeployedContract( {
        'name': 'square-example',
        'projectName': 'hello-world'
    } )
console.log( '   ', contract['explorer'] )

console.log( '- Load SmartContract Code' )
const sourceCode = contract['source'] 
const { Square } = await easyMina
    .loadModuleExperimental( { sourceCode } )

console.log( '- Compile' )
const zkAppInstance = new Square( contract['publicKey']['field'] )

console.log( Square )
process.exit( 1 )

const a = await Square.compile()


console.log( '- Prepare Transactions' )
const tx = await Mina.transaction(
    {
        'feePayerKey': deployer['privateKey']['field'],
        'fee': 100_000_000,
        'memo': 'abc'
    },
    () => {
        zkAppInstance.update( Field( 3433683820292512484657849089281 ) ) 
    }
)

console.log( '- Prove Transaction' )
await tx.prove()

console.log( '- Sign Transaction' )
const signedMessage = tx.sign( [ 
    deployer['privateKey']['field'], 
    // contract['privateKey']['field'] 
] )

console.log( '- Send Transaction' )
const response = await signedMessage.send()
console.log( `   https://minascan.io/berkeley/tx/${response.hash()}` )

