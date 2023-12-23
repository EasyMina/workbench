

import { Mina, AccountUpdate, PrivateKey } from 'o1js'
import { Square } from '../../../build/hello-world/backend/Square.js'
import { EasyMina } from '../../../src/EasyMina.mjs'

console.log( '- Add Network' )
const Berkeley = Mina.Network( { 'mina': 'https://berkeley.minascan.io/graphql' } )
Mina.setActiveInstance( Berkeley )
 
console.log( '- Add EasyMina' )
const easyMina = new EasyMina()
easyMina.init()

console.log( '- Import Accounts' )
const deployer = easyMina.getAccount( {
    'name': 'pilly',
    'groupName': 'group-a'
} )
const contract = easyMina.requestContract()

console.log( '- Compile Class' )
const zkApp = new Square( contract['publicKey']['field'] )
const compiled = await Square.compile()

console.log( '- Prepare Transactions' )
const tx = await Mina.transaction(
    {
        'feePayerKey': deployer['privateKey']['field'],
        'fee': 100_000_000,
        'memo': 'abc'
    },
    () => {
        AccountUpdate.fundNewAccount( deployer['privateKey']['field'] )
        zkApp.deploy( {
            'zkappKey': contract['privateKey']['field'],
            'verificationKey': compiled['verificationKey'],
            'zkAppUri': 'hello-world'
        } )
        zkApp.init()
    }
)

console.log( '- Prove Transaction' )
await tx.prove()

console.log( '- Sign Transaction' )
const signedMessage = tx.sign( [ 
    deployer['privateKey']['field'], 
    contract['privateKey']['field'] 
] )

console.log( '- Send Transaction' )
const response = await signedMessage.send()

const txHash = response.hash()
console.log( `https://berkeley.minaexplorer.com/transaction/${txHash}` )


