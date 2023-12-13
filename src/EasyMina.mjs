import { config } from './data/config.mjs'
import { Environment } from './environment/Environment.mjs'
import { printMessages } from './helpers/mixed.mjs'
import { Account } from './environment/Account.mjs'
import { Encryption } from './environment/Encryption.mjs'


export class EasyMina {
    #config


    constructor() {
        this.#config = config
    }


    async init( { accountGroup='a', projectName='hello-world' } ) {
        const [ messages, comments ] = this.#validateInit( { accountGroup, projectName } )

        const environment = new Environment( { 
            'validate': this.#config['validate']
        } )

        environment.init( { accountGroup, projectName } )

        environment.getState()

        
        printMessages( { messages, comments } )
        process.exit( 1 )



        const account = new Account( {
            'accounts': this.#config['accounts'],
            'networks': this.#config['networks']
        } )

        const encryption = new Encryption()



        const secret = encryption.createSecret()
        console.log( 'secret', secret )
        // const secret = process.env.EASYMINA
        encryption.setSecret( { secret } )

        const en = encryption.encrypt( { text: 'tehjhjkhjhjkhljklhhljklhjlhjlhjkst' } )
        const de = encryption.decrypt( { hash: en } )

        const result = await account.createDeployer( { 
            'name': 'alice', 
            pattern: true,
            networkNames: [ 'berkeley', 'testworld2', 'devnet' ]
        } )

        result['header']['explorer'] = Object
            .entries( this.#config['networks'] )
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a
                acc[ key ] = value['explorer']['wallet']
                    .replace( '{{publicKey}}', result['body']['account']['publicKey'] )
                return acc
            }, {} )

        result['body'] = encryption.encrypt( { 
            'text': JSON.stringify( result['body'] )
        } )

        console.log( 'result', JSON.stringify( result, null, 4 ) )

        result['body'] = JSON.parse( encryption.decrypt( { 'hash': result['body'] } ) ) 
 
        console.log( 'result', JSON.stringify( result, null, 4 ) )

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



        console.log( 'user', user  )
        // const [ messages, comments ] = environment.validate()
        // printMessages( { messages, comments } )

       return true
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