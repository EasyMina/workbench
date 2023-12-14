import { config } from './data/config.mjs'
import { Environment } from './environment/Environment.mjs'
import { printMessages } from './helpers/mixed.mjs'
import { Account } from './environment/Account.mjs'
import { Encryption } from './environment/Encryption.mjs'

import moment from 'moment'
import fs from 'fs'


export class EasyMina {
    #config


    constructor() {
        this.#config = config
    }


    async init( { accountGroup='a', projectName='hello-world' } ) {
        const [ messages, comments ] = this.#validateInit( { accountGroup, projectName } )
        printMessages( { messages, comments } )

        const account = new Account( {
            'accounts': this.#config['accounts'],
            'networks': this.#config['networks'],
            'validate': this.#config['validate']
        } ) 

        // const [ m, c ] = account.validateDeployer( { 'filePath': './.mina/accounts/1702507698.json' } )
        // printMessages( { 'messages': m, 'comments': c } )


        const environment = new Environment( { 
            'validate': this.#config['validate']
        } ) 

        environment.init( { accountGroup, projectName } )

        const state = environment.getState( { account } )
        console.log( 's', JSON.stringify( state, null, 4 ) )

process.exit( 1 )
        // const secret = encryption.createSecret()
        // console.log( 'secret', secret )
        // const secret = process.env.EASYMINA


        const names = [
            [ 'alice', 'a' ],
            [ 'bob', 'a' ]
        ]

       await this.#createAccounts( { names } )

        // const en = encryption.encrypt( { text: 'tehjhjkhjhjkhljklhhljklhjlhjlhjkst' } )
        // const de = encryption.decrypt( { hash: en } )


                
        process.exit( 1 )

/*
        environment.create()
*/
/*
        const deployer = account.createAddress( { 
            'name': 'alice',
            'pattern': false
        } )
// console.log( deployer )
        const response = await account.sendFaucet( { publicKey: deployer['publicKey'] } )
        if( response['success'] ) { 

        }
*/


        process.exit( 1 )




        // const [ messages, comments ] = environment.validate()
        // printMessages( { messages, comments } )

       return true
    }


    async #createAccounts( { names, account } ) {
        for( let i = 0; i < names.length; i++ ) {
            const [ name, groupName ] = names[ i ]
            const deployer = await this.#createAccount( {
                name,
                groupName,
                'pattern': true,
                'networkNames': [ 'berkeley' ],
                'secret': 'EApex4z3ZzkciZzn8f2mmz1ml7wlwyfZ28ejZv2oZu',
                'encrypt': false,
                account
            } )
        }

        return true
    }



    async #createAccount( { name, groupName, pattern, networkNames, secret, encrypt, account } ) {
        let deployer = await account
            .createDeployer( { name, groupName, pattern, networkNames } )

        const encryption = new Encryption()
        encryption.setSecret( { secret } )
        if( encrypt ) {
            deployer = encryption.encryptDeployer( { deployer } )
        }
        
        return deployer
    }


    #validateInit( { accountGroup, projectName } ) {
        const messages = []
        const comments = []
 
        const tmp = [
            [ accountGroup, 'accountGroup', 'stringsAndDash' ],
            [ projectName, 'projectName', 'stringsAndDash' ]
        ]
            .forEach( a => {
                const [ value, key, regexKey ] = a
                if( typeof value !== 'string' ) {
                    messages.push( `Key '${key}' is not type of string` )
                } else if( !this.#config['validate']['values'][ regexKey ]['regex'].test( value ) ) {
                    messages.push( `Key '${key}' with the value '${value}' has not the expected pattern. ${this.#config['validate']['values'][ regexKey ]['description']}`)
                }
            } )

        return [ messages, comments ]
    }
}