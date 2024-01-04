

import { Mina, AccountUpdate } from 'o1js'
import { Square } from './../contracts/build/Square.js'
import { EasyMina } from '../../../src/EasyMina.mjs'


console.log( '- Add Network' )
const Berkeley = Mina.Network( 
    'https://proxy.berkeley.minaexplorer.com/graphql' 
)

Mina.setActiveInstance( Berkeley )
 
console.log( '- Add EasyMina' )
const easyMina = new EasyMina()
easyMina.init()

console.log( '- Import Accounts' )
const deployer = easyMina.getAccount( {
    'name': 'cetris',
    'groupName': 'new-berkeley'
} )

const contract = await easyMina.requestContract( {
        'name': 'square-example',
        'sourcePath': './../contracts/build/Square.js',
        'networkName': 'berkeley',
        deployer
} )

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

easyMina.saveContract( { response } )
