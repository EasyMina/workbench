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


    async init() {
        const environment = new Environment( { 
            'validate': this.#config['validate'] 
        } )

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
        console.log( 'en', en ) 
        const de = encryption.decrypt( { hash: en } )
        console.log( 'de', de )

/*
        environment.create()
*/

        const deployer = account.createAddress( { 
            'name': 'alice',
            'pattern': false
        } )
// console.log( deployer )
        const response = await account.sendFaucet( { publicKey: deployer['publicKey'] } )
// console.log( response )

        process.exit( 1 )



        console.log( 'user', user  )
        // const [ messages, comments ] = environment.validate()
        // printMessages( { messages, comments } )

       return true
    }
}