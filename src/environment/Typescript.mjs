import { printMessages } from './../helpers/mixed.mjs'
import fs from 'fs'


export class Typescript {
    #config

    constructor( { typescript } ) {
        this.#config = { typescript }
        return true
    }


    addConfig() {
        const path = this.#config['typescript']['fileName']
        if( !fs.existsSync( this.#config['typescript']['fileName'] ) ) { 
            const template = JSON.parse( 
                JSON.stringify( this.#config['typescript']['template'] ) 
            )

            template['compilerOptions']['outDir'] = './build/'
            template['compilerOptions']['rootDir'] = './workdir/'
            template['include'] = [ './workdir/' ]

            fs.writeFileSync( 
                path, 
                JSON.stringify( template, null, 4 ),
                'utf-8'
            )
        } else {
            const [ messages, comments ] = this.#validateConfig( { path } )
            printMessages( { messages, comments } )
        }

        return true
    }


    #validateConfig( { path } ) {
        const messages = []
        const comments = []

        let json
        try {
            const txt  = fs.readFileSync( path, 'utf-8' )
            json = JSON.parse( txt )
        } catch( e ) {
            messages.push( `Typescript config file '${path}' is not a valid json.` )
        }

        if( messages.length === 0 ) {
            Object
                .entries( this.#config['typescript']['template'] )
                .forEach( a => {
                    const [ key, value ] = a
                  //   console.log( 'key', key )
                  //  console.log( '>>>', Object.hasOwn( json, key ) )
                    if( !Object.hasOwn( json, key ) ) {
                        messages.push( `Typescript config file, key '${key}' is missing.` )
                    } else if( 
                        typeof json[ key ] === 'object' &&
                        !Array.isArray( json[ key ] ) && 
                        json[ key ] !== null 
                    ) {
                        Object
                            .entries( value )
                            .forEach( b => {
                                const [ k, v ] = b
                                if( !Object.hasOwn( json[ key ], k ) ) {
                                    messages.push( `Typescript config file, key '${key}.${k}' is missing.` )
                                }
                            } )
                    }

                } )
        }

        return [ messages, comments ]
    }
}