import { config } from './data/config.mjs'
import { Environment } from './environment/Environment2.mjs'

import { printMessages } from './helpers/mixed.mjs'
import { Account } from './environment/Account.mjs'
import { Encryption } from './environment/Encryption.mjs'
import { Typescript } from './environment/Typescript.mjs'
import { Server } from './server/Server.mjs'
import { ProjectImporter } from './import/ProjectImporter.mjs'


import moment from 'moment'
import fs from 'fs'
import { PrivateKey } from 'o1js'


export class EasyMina {
    #config
    #state
    #environment
    #account
    #encryption
    #projectImporter


    constructor() {
        this.#config = config

        return 
    }


    init() {
        const networkNames = [ 'berkeley' ]
        const encryption = true

        this.#account = this.#addAccount()
        this.#environment = this.#addEnvironment()
        this.#encryption = new Encryption()
        this.#state = this.#addState( { networkNames, encryption } )

        this.#encryption.setSecret( { 'secret': this.#state['secret'] } )

        const typescript = new Typescript( {
            'typescript': this.#config['typescript']
        } )
        typescript.addConfig()
   
        this.#projectImporter = new ProjectImporter()

        /*
        const git = new Git( {
            'git': this.#config['git']
        } )
        git.addGitIgnore()

*/



        return this
    }


    setAccountGroup( accountGroup ) {
        const [ messages, comments ] = this.#validateState( { accountGroup } )
        printMessages( { messages, comments } )

        this.#state['accountGroup'] = accountGroup
        return this
    }


    setProjectName( projectName ) {
        const [ messages, comments ] = this.#validateState( { projectName } )
        printMessages( { messages, comments } )

        this.#state['projectName'] = projectName
        return this
    }


    async newPersonas( { names=[ 'this', 'that' ] } ) {
        const [ messages, comments ] = this.#validateState( { names } )
        printMessages( { messages, comments } )

        const { accountGroup, projectName } = this.#state
        this.#environment.init( { accountGroup, projectName } )
        this.#environment.updateFolderStructure()

        const nameCmds = names
            .map( name => [ name, accountGroup ] )
        await this.#createMissingAccounts( { nameCmds, accountGroup } )

        return true
    }


    getAccount( { name, groupName } ) {
        const accounts = this.#environment.getAccounts( { 
            'account': this.#account, 
            'encrypt': this.#encryption 
        } )

        try {
            accounts[ groupName ][ name ]
        } catch( e ) {
            console.log( 'account not found.' )
            process.exit( 1 )
        }

        const select = accounts[ groupName ][ name ]
        let json = JSON.parse( fs.readFileSync( select['filePath'], 'utf-8' ) )
        if( json['header']['encrypt'] ) {
            json['body'] = JSON.parse( this.#encryption.decrypt( { 'hash': json['body'] } ) )
        }

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

        result['privateKey']['base58'] = json['body']['account']['privateKey']
        result['privateKey']['field'] = PrivateKey.fromBase58( result['privateKey']['base58'] )

        result['publicKey']['field']  = result['privateKey']['field']
            .toPublicKey()

        result['publicKey']['base58'] = result['publicKey']['field']
            .toBase58()

        return result
    }


    requestContract() {
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

        return result
    }

/*
    #detectSecret( { filePath=null } ) {
        let messages = []
        let comments = []

        const key = this.#config['secret']['key']

        if( filePath !== null ) {

        }


        if( Object.hasOwn( process.env, key ) ) {
            if( process.env[ key ] === undefined || process.env[ key ] === null ) {
                messages.push( `Environment variable '${key}' is not set as environment variable.` )
            } else if( typeof process.env[ key ] != 'string' ) {
                messages.push( `Environment variable '${key}' is not type of string.` )
            } else {
                const secret = process.env[ key ]
                const [ m, c ] = this.#encryption.validateSecret( { secret } ) 
                messages = [ ...messages, ...m ]
                comments = [ ...comments, ...c ]
            }
        } else {
            messages.push( `Environment variable '${key}' is not set.` )
        }

        console.log( 'Mesages', messages )
        process.exit( 1 )
        // console.log( 'test', test )
        return true
    }
*/
    startServer() {
        const server = new Server( {
            'server': this.#config['server'],
            'validate': this.#config['validate']
        } )

        server
            .init( { 'projectName': this.#state['projectName'] } )
            .start()

        return true
    }


    async importProject( { projectPath } ) {
        await this.#projectImporter.addProject( { projectPath } )

        console.log( 'A' )
        return true
    }


    #addState( { encryption, networkNames } ) {
        const secret = this.#environment.getSecret( {
            'filePath': null,
            'encryption': this.#encryption
        } )
    
/*
        this.#environment.createSecretFile( { 
            'encryption': this.#encryption 
        } )
*/

        const state = {
            'accountGroup': null,
            'projectName': null,
            'names': null,
            secret,
            networkNames,
            encryption
        }

        return state
    }


    #addAccount() {
        const account = new Account( {
            'accounts': this.#config['accounts'],
            'networks': this.#config['networks'],
            'validate': this.#config['validate']
        } ) 

        return account
    }


    #addEnvironment() {
        const environment = new Environment( { 
            'validate': this.#config['validate'],
            'secret': this.#config['secret']
        } ) 

        return environment
    }


    async #createMissingAccounts( { nameCmds } ) {
        const availableDeyployers = this.#environment.getAccounts( { 
            'account': this.#account, 
            'encrypt': this.#encryption 
        } )

        console.log( availableDeyployers )
        const missingNames = nameCmds
            .filter( a => {
                const [ name, accountGroup ] = a
                if( Object.hasOwn( availableDeyployers, accountGroup ) ) {
                    if( Object.hasOwn( availableDeyployers[ accountGroup ], name ) ) {
                        return false
                    } else {
                        return true
                    }
                } else {
                    return true
                }
            } )

        for( let i = 0; i < missingNames.length; i++ ) {
            const [ name, groupName ] = missingNames[ i ]
            console.log( 'Create', name )
            const deployer = await this.#createAccount( {
                name,
                groupName,
                'pattern': true,
                'networkNames': this.#state['networkNames'],
                'secret': this.#state['secret'],
                'encrypt': this.#state['encryption'],
                'account': this.#account
            } )

            let path = [
                this.#config['validate']['folders']['credentials']['name'],
                this.#config['validate']['folders']['credentials']['subfolders']['accounts']['name'],
                `${name}--${moment().unix()}.json`
            ]
                .join( '/' )
     
            fs.writeFileSync( 
                path, 
                JSON.stringify( deployer, null, 4 ), 
                'utf-8'
            )
        }

        return true
    }


    async #createAccount( { name, groupName, pattern, networkNames, secret, encrypt, account } ) {
        let deployer = await account
            .createDeployer( { name, groupName, pattern, networkNames, encrypt } )

        if( encrypt ) {
            deployer = this.#encryption.encryptDeployer( { deployer } )
        }
        
        return deployer
    }


    #validateState( { accountGroup=null, projectName=null, names=null } ) {
        const messages = []
        const comments = []
 
        const tests = []
        accountGroup !== null ? tests.push( [ accountGroup, 'accountGroup', 'stringsAndDash' ] ) : ''
        projectName !== null ? tests.push( [ projectName, 'projectName', 'stringsAndDash' ] ) : ''

        const tmp = tests
            .forEach( a => {
                const [ value, key, regexKey ] = a
                if( typeof value !== 'string' ) {
                    messages.push( `Key '${key}' is not type of string` )
                } else if( !this.#config['validate']['values'][ regexKey ]['regex'].test( value ) ) {
                    messages.push( `Key '${key}' with the value '${value}' has not the expected pattern. ${this.#config['validate']['values'][ regexKey ]['description']}` )
                }
            } )

        if( names === null ) {
            
        } else if( !Array.isArray( names ) ) {
            messages.push( `Key 'names' is not type of array.` )
        } else if( names.length === 0 ) {
            messages.push( `Key 'names' is empty` )
        } else {
            names
                .forEach( ( value, index ) => {
                    if( typeof value !== 'string' ) {
                        messages.push( `Key 'names' with the value '${value}' is not type of string.` )
                    } else if( !this.#config['validate']['values']['stringsAndDash']['regex'].test( value ) ) {
                        messages.push( `Key '${key}' with the value '${value}' has not the expected pattern. ${this.#config['validate']['values']['stringsAndDash']['description']}` )
                    }

                } )
        }

        return [ messages, comments ]
    }
}