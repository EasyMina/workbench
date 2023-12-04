import { config } from './data/config.mjs'
import { Environment } from './environment/Environment.mjs'
import { printMessages } from './helpers/mixed.mjs'


export class EasyMina {
    #config


    constructor() {
        this.#config = config
    }


    init() {
        const environment = new Environment( { 
            'validate': this.#config['validate'] 
        } )

        const [ messages, comments ] = environment.validate()
        printMessages( { messages, comments } )

       return true
    }



}