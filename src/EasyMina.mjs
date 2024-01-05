import { config } from './data/config.mjs'
import { Environment } from './environment/Environment2.mjs'

import { printMessages } from './helpers/mixed.mjs'
import { Account } from './environment/Account.mjs'
import { Contract } from './environment/Contract.mjs'
import { Encryption } from './environment/Encryption.mjs'
import { Typescript } from './environment/Typescript.mjs'
import { Server } from './server/Server2.mjs'
import { ProjectImporter } from './import/ProjectImporter.mjs'
import { MinaData } from 'minadata'

import path from 'path'

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
    #contract
    #minaData


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
            'validate': this.#config['validate'],
            'typescript': this.#config['typescript']
        } )

        typescript.addConfigs( { 
            'environment': this.#environment
        } )
   
        this.#projectImporter = new ProjectImporter( {
            'validate': this.#config['validate']
        } )

        this.#contract = new Contract( {
            'validate': this.#config['validate'],
            'networks': this.#config['networks'],
            'contracts': this.#config['contracts']
        } )

        this.#minaData = new MinaData()
        this.#minaData.init( {} )

/*
        const git = new Git( {
            'git': this.#config['git']
        } )
        git.addGitIgnore()

*/

        return this
    }

/*
    setAccountGroup( groupName ) {
        const [ messages, comments ] = this.#validateState( { groupName } )
        printMessages( { messages, comments } )

        this.#state['groupName'] = groupName
        return this
    }
*/

    setProjectName( projectName ) {
        const [ messages, comments ] = this.#validateState( { projectName } )
        printMessages( { messages, comments } )

        this.#state['projectName'] = projectName
        return this
    }


    async createAccounts( { names=[], networkName='berkeley', groupName, pattern=true } ) {
        const [ messages, comments ] = this.#validateState( { names, networkName, pattern, groupName } )
        printMessages( { messages, comments } )

        const { groupName, projectName } = this.#state
        this.#environment.init( { groupName, projectName } )
        this.#environment.updateFolderStructure()

        const missingNames = this.#getMissingAccounts( { names, groupName, networkName, pattern } )
        
        for( let i = 0; i < missingNames.length; i++ ) {
            const [ name, groupName ] = missingNames[ i ]
            console.log( 'Create', name )
            const deployer = await this.createAccount( {
                name,
                groupName,
                pattern,
                networkName
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


    async createAccount( { name, groupName, pattern, networkName, /*secret, encrypt, account*/ } ) {
        const secret = this.#state['secret']
        const encrypt = this.#state['encryption']
        const account = this.#account

        let deployer = await account
            .createDeployer( { name, groupName, pattern, networkName, encrypt } )

        deployer = this.#encryption.encryptCredential( { 
            'credential': deployer
        } )
        
        return deployer
    }


    getDevelopmentContracts() {
        return this.#environment
            .getDevelopmentContracts()
    }


    getDevelopmentContract( { name, projectName } ) {
        const contracts = this.getDevelopmentContracts()
        // console.log( 'c', contracts )
        const [ messages, comments ] = this.#validateGetContracts( { name, projectName, contracts } )
        printMessages( { messages, comments } )

        const result = contracts[ projectName ][ name ]
        return result
    }


    getDeployedContracts() {
        const contracts = this.#environment
            .getDeployedContracts( {
                'contract': this.#contract, 
                'encrypt': this.#encryption 
            } )

        return contracts
    }


    getDeployedContract( { name, projectName } ) {
        const contracts = this.getDepoloyedContracts()
        const deployedContracts = this.getDeployedContracts()
        console.log( '>', deployedContracts )

        return true
    }


    getAccounts() {
        const accounts = this.#environment.getAccounts( { 
            'account': this.#account, 
            'encrypt': this.#encryption 
        } )

        return accounts 
    }


    async getAccount( { name, groupName } ) {
        const accounts = this.getAccounts()
        const [ messages, comments ] = this.#validateGetAccount( { name, groupName, accounts } )
        printMessages( { messages, comments } )

        const select = accounts[ groupName ][ name ]
        const accountStatus = await this.#minaData.getData( { 
            'preset': 'accountBalance', 
            'userVars': {
                'publicKey': select['addressFull']
            },
            'network': 'berkeley'
        } )

        console.log( '>>>', JSON.stringify( accountStatus, null, 4 ))

        if( accountStatus['data']['account'] === null ) {
            console.log( `Account is unknown. Pease check the status: ${select['faucetTxHashExplorer']}.` )
            process.exit( 1 )
        } else {
            accountStatus['data']['account']['total']
        }


        let credential = JSON.parse( fs.readFileSync( select['filePath'], 'utf-8' ) )
        credential = this.#encryption.decryptCredential( { credential } )

        const result = {
            'filePath': select['filePath'],
            'privateKey': {
                'field': null,
                'base58': null
            },
            'publicKey': {
                'field': null,
                'base58': null
            }
        }

        result['privateKey']['base58'] = credential['body']['account']['privateKey']
        result['privateKey']['field'] = PrivateKey.fromBase58( result['privateKey']['base58'] )

        result['publicKey']['field']  = result['privateKey']['field'].toPublicKey()

        result['publicKey']['base58'] = result['publicKey']['field'].toBase58()

        return result
    }


    async requestContract( { name, networkName, deployer, encrypt=true, sourcePath=null } ) {
        const contractAbsolutePath = path.resolve(
            path.dirname( process.argv[ 1 ] ), 
            `${sourcePath}`
        )

        const [ messages, comments ] = this.#contract
            .validateRequest( { 
                name, 
                contractAbsolutePath, 
                networkName, 
                deployer,
                encrypt 
            } )
        printMessages( { messages, comments } )

        const result = await this.#contract.request( { 
            name, 
            contractAbsolutePath,
            networkName,
            deployer,
            encrypt,
            'environment': this.#environment
        } )

        return result['body']
    }


    async saveContract( { response }) {
        const result = await this.#contract.prepareSave( { 
            'encryption': this.#encryption 
        } )

        const networkName = result['header']['networkName']
        result['header']['txHash'] = response.hash()
        result['header']['txHashExplorer'] = this.#config['networks'][ networkName ]['explorer']['transaction']
            .replace( '{{txHash}}', result['header']['txHash'] )

        let path = [
            this.#config['validate']['folders']['credentials']['name'],
            this.#config['validate']['folders']['credentials']['subfolders']['contracts']['name'],
            `${result['header']['name']}--${moment().unix()}.json`
        ]
            .join( '/' )
 
        fs.writeFileSync( 
            path, 
            JSON.stringify( result, null, 4 ), 
            'utf-8'
        )

        return result
    }


    startServer() {
        console.log( `Start server for '${this.#state['projectName']}'.` )
        const server = new Server( {
            'server': this.#config['server'],
            'validate': this.#config['validate']
        } )

        server
            .init( {
                'projectName': this.#state['projectName'],
                'environment': this.#environment,
                'account': this.#account, 
                'encrypt': this.#encryption
            } )
            .start()

        return true
    }


    async importProject( { projectPath } ) {
        await this.#projectImporter.addProject( { projectPath } )

        console.log( 'A' )
        return true
    }


    async exportProject( { projectName } ) {
        // TODO
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
            'groupName': null,
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
            'secret': this.#config['secret'],
            'typescript': this.#config['typescript']
        } ) 

        return environment
    }


    #getMissingAccounts( { names, groupName } ) {
        const availableDeyployers = this.#environment.getAccounts( { 
            'account': this.#account, 
            'encrypt': this.#encryption 
        } )

        const missingNames = names
            .filter( name => {
                if( Object.hasOwn( availableDeyployers, groupName ) ) {
                    if( Object.hasOwn( availableDeyployers[ groupName ], name ) ) {
                        return false
                    } else {
                        return true
                    }
                } else {
                    return true
                }
            } )

        return missingNames
    }





    #validateState( { groupName=null, projectName=null, names=null, networkName=null, pattern=null } ) {
        const messages = []
        const comments = []
 
        const tests = []
        groupName !== null ? tests.push( [ groupName, 'groupName', 'stringsAndDash' ] ) : ''
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

        if( networkName === null ) {
        } else if( typeof networkName !== 'string' ) {
            messages.push( `Key 'networkName' is not type of string.` )
        } else if( !this.#config['networks']['supported'].includes( networkName ) ) {
            messages.push( `Key 'networkName' with the value '${networkName}' is not a valid input. Supported networks are ${this.#config['networks']['supported'].join( ',' )}.` )
        }

        if( pattern === null ) {
        } else if( typeof pattern !== 'boolean' ) {
            messages.push( `Key 'pattern' is not type of 'boolean'.` )
        }

        return [ messages, comments ]
    }


    #validateGetContracts( { name, projectName, contracts } ) {
        const messages = []
        const comments = []

        if( typeof name !== 'string' ) {
            messages.push( `Key 'name' is not tyoe of string.` )
        }

        if( typeof projectName !== 'string' ) {
            messages.push( `Key 'projectName' is not type of string.` )
        } else if( !Object.keys( contracts ).includes( projectName ) ) {
            messages.push( `Key 'projectName' with the value '${projectName}' is not valid. Choose from ${Object.keys( contracts ).join( ', ' )} instead.` )
        }

        if( messages.length !== 0 ) {
            return [ messages, comments ]
        }

        const keys = Object.keys( contracts[ projectName ] )
        if( !keys.includes( name ) ) {
            messages.push( `Key 'name' with the value '${name}' is not valid. Choose from ${keys.join( ', ' )} instead.` )
        }

        return [ messages, comments ]
    }


    #validateGetAccount( { name, groupName, accounts } ) {
        const messages = []
        const comments = []

        if( typeof name !== 'string' ) {
            messages.push( `Key 'name' is not type of 'string'.` )
        } 

        if( typeof groupName !== 'string' ) {
            messages.push( `Key 'groupName' is not type of 'string'.` )
        } else if( !Object.keys( accounts ).includes( groupName ) ) {
            messages.push( `Key 'groupName' with the value '${groupName}' is not valid. Choose from ${Object.keys( accounts ).join( ', ' )} instead.` )
        }

        if( messages.length !== 0 ) {
            return [ messages, comments ]
        }

        if( !Object.keys( accounts[ groupName ] ).includes( name ) ) {
            messages.push( `Key 'name' with the value '${name}' is not valid. Choose from ${Object.keys( accounts[ groupName ] )} instead.` )
        }

        return [ messages, comments ]
    }
}