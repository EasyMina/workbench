

import { Mina, AccountUpdate } from 'o1js'
import { Square } from './build/Square.js'
import { EasyMina } from '../../../src/EasyMina.mjs'
import fs from 'fs'

console.log( '- Add Network' )
const Berkeley = Mina.Network( { 
    'mina': 'https://berkeley.minascan.io/graphql' 
} )
Mina.setActiveInstance( Berkeley )
 
console.log( '- Add EasyMina' )
const easyMina = new EasyMina()
easyMina.init()

console.log( '- Import Accounts' )
const deployer = easyMina.getAccount( {
    'name': 'alice',
    'groupName': 'new-berkeley'
} )

const contract = easyMina.requestContract( {
        'name': 'square-example',
        'source': fs.readFileSync( './build/Square.js', 'utf-8' )
} )

process.exit( 1 )

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

easyMina.saveContract()
