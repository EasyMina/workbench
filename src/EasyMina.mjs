import { config } from './data/config.mjs'
import { Environment } from './environment/Environment.mjs'
import { printMessages } from './helpers/mixed.mjs'
import { Account } from './environment/Account.mjs'


export class EasyMina {
    #config


    constructor() {
        this.#config = config
    }


    init() {
        /*
        const environment = new Environment( { 
            'validate': this.#config['validate'] 
        } )

        environment.create()
        */

        const account = new Account( {
            'accounts': this.#config['accounts']
        })
        account.createAddress()
        // const [ messages, comments ] = environment.validate()
        // printMessages( { messages, comments } )

       return true
    }
}