import { PrivateKey } from 'o1js'
import { printMessages } from './../helpers/mixed.mjs'


export class Contract {
    #config
    #state


    constructor( {} ) {
        this.#config = {}
        this.init()
    }

    init() {
        this.#state = {}
    }


    request() {
        const [ messages, comments ] = this.#validateState( { 'state': this.#state } )
        printMessages( { messages, comments } )

        const result = {
            'privateKey': {
                'field': null,
                'base58': null
            },
            'publicKey': {
                'field': null,
                'base58': null
            }
        }

        result['privateKey']['base58'] = PrivateKey
            .random()
            .toBase58()
        result['privateKey']['field'] = PrivateKey.fromBase58( result['privateKey']['base58'] )

        result['publicKey']['field']  = result['privateKey']['field']
            .toPublicKey()

        result['publicKey']['base58'] = result['publicKey']['field']
            .toBase58()
        this.#state['requestContract'] = result

        return result
    }


    async save( { name, contractContent } ) {
        const [ messages, comments ] = this.#validateState( { 'state': this.#state } )
        printMessages( { messages, comments } )

        const struct = {
            'header': {
                'name': name,
                'contractMethods': null
            },
            'body': {
                'contract': {
                    'sourceName': '',
                    'methods': null
                }
            }
        }


        const contracClass = await import( contractContent )
        console.log( contracClass )
        struct['contractMethods'] = [ contractClass, '_methods' ]
            .reduce( ( acc, key, index, all ) => {
                try {
                    acc = acc[ key ]
                    if( index === all.length - 1 ) {
                        acc = acc.map( b  => b['methodName'] )
                    }
                } catch( e ) {
                    console.log( e )
                    acc = []
                }
                return acc
            }, raw )

        return true
    }


    #validateState( { state } ) {
        const messages = []
        const comments = []

        if( typeof state === 'undefined' ) {
            messages.push( `Class 'Contract' the variable 'state' is not initialized. Run .init() before.` )
        } else if (typeof state !== 'object' || state === null || Array.isArray( state ) ) {
            messages.push( `Class 'Contact' the variable 'state' is not type of '{}'.` )
        }

        return [ messages, comments ]
    }
}