import { PrivateKey } from 'o1js'
import { printMessages } from './../helpers/mixed.mjs'
import fs from 'fs'
import moment from 'moment'


export class Contract {
    #config
    #state


    constructor( { validate, networks, contracts } ) {
        this.#config = { validate, networks, contracts }
        this.init()
    }


    init() {
        this.#state = {}
    }


    async request( { name, contractAbsolutePath, networkName, deployer, encrypt, environment } ) {
        const [ messages, comments ] = this.#validateState( { 'state': this.#state } )
        printMessages( { messages, comments } )

        const result = {
            'header': {
                name,
                'methods': [],
                'projectName': null,
                networkName,
                'addressShort': null,
                'addressFull': null,
                'explorer': null,
                'created': null,
                'deployer': null,
                'source': null,
                encrypt
            },
            'body': {
                'privateKey': {
                    'field': null,
                    'base58': null
                },
                'publicKey': {
                    'field': null,
                    'base58': null
                }
            },
            'disclaimer': null
        }

        result['body']['privateKey']['base58'] = PrivateKey
            .random()
            .toBase58()
        result['body']['privateKey']['field'] = PrivateKey
            .fromBase58( result['body']['privateKey']['base58'] )
        result['body']['publicKey']['field']  = result['body']['privateKey']['field']
            .toPublicKey()
        result['body']['publicKey']['base58'] = result['body']['publicKey']['field']
            .toBase58()

        result['header']['source'] = fs.readFileSync( contractAbsolutePath, 'utf-8' )
        result['header']['deployer'] = deployer['filePath']
        result['header']['projectName'] = environment
            .getProjectNames()
            .reduce( ( acc, projectName, index ) => {
                const result = contractAbsolutePath
                    .split( '/' )
                    .find( a => ( a === projectName ) )
                result !== undefined ? acc = result : ''
                return acc
            }, '' )
        result['header']['methods'] = await environment
            .getScriptMethods( { contractAbsolutePath } )
        result['header']['created'] = moment().format( 'YYYY-MM-DD hh:mm:ss A')

        const publicKey = result['body']['publicKey']['base58']
        result['header']['addressShort'] = 
            `${publicKey.slice( 0, 8 )}...${publicKey.slice( -4 )}`
        result['header']['addressFull'] = publicKey
        result['header']['explorer'] = this.#config['networks'][ networkName ]['explorer']['wallet']
            .replace( '{{publicKey}}', publicKey )

        result['disclaimer'] = this.#config['contracts']['disclaimer']

        this.#state['requestContract'] = result
        return result
    }

    async prepareSave( { encryption } ) {
        const [ messages, comments ] = this.#validateState( { 'state': this.#state } )
        printMessages( { messages, comments } )

        let contract = this.#state['requestContract']
        let credential = this.#state['requestContract']
        credential['body'] = {
            'account': {
                'publicKey': credential['body']['publicKey']['base58'],
                'privateKey': credential['body']['privateKey']['base58'],
            }
        }

        credential = encryption.encryptCredential( { credential } )
        return credential
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


    validateRequest( { name, contractAbsolutePath, networkName, deployer, encrypt } ) {
        const messages = []
        const comments = []

        if( typeof name !== 'string' ) {
            messages.push( `Key 'name' is not type of 'string'.` )
        } else if( !this.#config['validate']['values']['stringsAndDash']['regex'].test( name ) ) {
            messages.push( `Key 'name' with the value '${name}' has not the expected pattern. ${this.#config['validate']['values']['stringsAndDash']['description']}` )
        }

        if( contractAbsolutePath === null ) {
            comments.push( `Key 'source' is empty, will ignored.` )
        } else if( typeof contractAbsolutePath !== 'string' ) {
            messages.push( `Key 'source' is not type of 'string'.` )
        } else if( !fs.existsSync( contractAbsolutePath ) ) {
            messages.push( `Key 'source' provided path '${contractAbsolutePath}' is not valid.` )
        }

        if( typeof networkName !== 'string' ) {
            messages.push( `Key 'networkName' is not type of 'string'.` )
        } else if( networkName === '' ) {
            messages.push( `Key 'networkName' can not be ''. Supported networks are ${this.#config['networks']['supported'].map( a => `'${a}'`).join( ', ' )}.` )
        } else if( !this.#config['networks']['supported'].includes( networkName ) ) {
            messages.push( `Key 'networkName' with the value '${networkName}' is not a currently supported network. Supported networks are ${this.#config['networks']['supported'].map( a => `'${a}'`).join( ', ' )}.` )
        }

        if( typeof encrypt !== 'boolean' ) {
            messages.push( `Key 'encrypt' is not type of 'boolean'. ` )
        }

        if( typeof deployer !== 'object' ) {
            messages.push( `Key 'deployer' is not type of 'object'.` )
        }

        return [ messages, comments ]
    }
}