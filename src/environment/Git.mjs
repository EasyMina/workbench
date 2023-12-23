import { printMessages } from './../helpers/mixed.mjs'
import fs from 'fs'


export class Git {
    #config

    constructor( { git } ) {
        this.#config = { git }
        return true
    }


    addIgnoreFile() {
        const path = this.#config['typescript']['fileName']
        if( !fs.existsSync( this.#config['typescript']['fileName'] ) ) {
            exists = false
            fs.writeFileSync( 
                path, 
                JSON.stringify( this.#config['typescript']['template'], null, 4 ),
                'utf-8'
            )
        } else {
            const [ messages, comments ] = this.#validateConfig( { path } )
            printMessages( { messages, comments } )
        }


        return true
    }


    #validateConfig( { path } ) {

}