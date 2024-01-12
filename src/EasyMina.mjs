import { config } from './data/config.mjs'
import { Environment } from './environment/Environment2.mjs'

import { printMessages, shortenAddress } from './helpers/mixed.mjs'
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
import axios from 'axios'
import crypto from 'crypto'
import { fileURLToPath } from 'url'


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


    init( cfg={ encryption: true, setSecret: true } ) {
        const [ messages, comments ] = this.#validateInit( cfg )
        printMessages( { messages, comments } )

        this.#encryption = new Encryption()
        this.#environment = new Environment( { 
            'validate': this.#config['validate'],
            'secret': this.#config['secret'],
            'typescript': this.#config['typescript']
        } ) 

        this.#account = new Account( {
            'accounts': this.#config['accounts'],
            'networks': this.#config['networks'],
            'validate': this.#config['validate']
        } ) 

        this.#contract = new Contract( {
            'validate': this.#config['validate'],
            'networks': this.#config['networks'],
            'contracts': this.#config['contracts']
        } )

        const typescript = new Typescript( {
            'validate': this.#config['validate'],
            'typescript': this.#config['typescript']
        } )

/*
        typescript.addConfigs( { 
            'environment': this.#environment
        } )
*/ 
        this.#projectImporter = new ProjectImporter( {
            'validate': this.#config['validate'],
            'importer': this.#config['importer']
        } )

        this.#state = {
            'groupName': null,
            'projectName': null,
            'names': null,
            'secretString': null,
            'secretId': null,
            'encryption': cfg['encryption']
        }

        this.#minaData = new MinaData()
        this.#minaData.init({})

        if( cfg['setSecret'] ) {
            this.setSecret()
        }

/*
        const git = new Git( {
            'git': this.#config['git']
        } )
        git.addGitIgnore()

*/
        return this
    }


    setSecret() {
        const secret = this.#environment.getSecret( {
            'encryption': this.#encryption
        } )

        this.#state['secretString'] = secret['secret']
        this.#state['secretId'] = secret['id']

        this.#encryption.setSecret( { 
            'secret': secret['secret']
        } )
    }


    getEnvironmentStatus() {
        const status = this.#environment
            .getStatus( { 'encryption': this.#encryption } )

        status['environmentReady'] = [
            status['secret']['secret'] !== null
            ,Object
                .entries( status['folders'] )
                .every( a => a[ 1 ]['status'] )
        ]
            .every( a => a )

        return status 
        // this.#environment.setFolderStructure( { 'encryption': this.#encryption } )
        // this.#state = this.#addState( { 'encryption': cfg['encryption'] } )
        // this.#encryption.setSecret( { 'secret': this.#state['secret'] } )
    }


    setEnvironment() {
        this.#environment.setFolderStructure( { 
            'encryption': this.#encryption 
        } )

        let secret = this.#environment.getSecret( {
            'encryption': this.#encryption
        } )

        if( secret['secret'] === null ) {
            this.#environment.createSecretFile( { 
                'encryption': this.#encryption
            } )

            secret = this.#environment.getSecret( {
                'encryption': this.#encryption
            } )
        }

        this.#state['secretString'] = secret['secret']
        this.#state['secretId'] = secret['id']

        this.#encryption.setSecret( { 
            'secret': this.#state['secretString'] 
        } )

        return true
    }

/*
    setAccountGroup( groupName ) {
        const [ messages, comments ] = this.#validateState( { groupName } )
        printMessages( { messages, comments } )

        this.#state['groupName'] = groupName
        return this
    }
*/

/*
    setProjectName( projectName ) {
        const [ messages, comments ] = this.#validateState( { projectName } )
        printMessages( { messages, comments } )

        this.#state['projectName'] = projectName
        return this
    }
*/
    exportProject( { projectName, name='', description='', phrase, encryption=true } ) {
        if( phrase === undefined ) {
            phrase = this.#config['importer']['localPhrase']
            console.log( `Key 'phrase' not found, chose '${phrase}' as phrase value instead.` )
        }

        const data = this.#projectImporter
            .createExport( { projectName } )

        let result
        if( encryption ) {
            const encrypt = new Encryption()
            result = encrypt
                .setSecret( { 'secret': phrase, 'secure': false } )
                .encrypt( { 'text': JSON.stringify( data ), 'secure': false } )
        } else {
            result = data
        }

        const envelope = {
            name,
            description,
            'encrypt': encryption,
            'created': moment().format( 'YYYY-MM-DD hh:mm:ss A' ),
            'content': result
        }

        const base64 = Buffer
            .from( JSON.stringify( envelope, null, 4 ) )
            .toString( 'base64' )

        const str = `data:application/json;base64,${base64}`
        const hash = crypto.createHash( 'sha256' )
        hash.update( str )
        const hashValue = hash.digest( 'hex' )

        const fullPath = `${data['rootPath']}/${projectName}--${hashValue.substring(0,23)}.txt`
        fs.writeFileSync( fullPath, str, 'utf-8' )
        console.log( `  > ${fullPath}` )
        return result
    }


    async importProject( { url, phrase, projectName, hash='' } ) {
        const projectNames = this.getProjectNames()
        if( projectNames.includes( projectName ) ) {
            const newName = `${projectName}-${moment().unix()}`
            projectName = newName
            console.log( `ProjectName already exists. Used ${newName} instead.`)
        }

        if( phrase === undefined ) {
            phrase = this.#config['importer']['localPhrase']
            console.log( `Key 'phrase' not found, chose '${phrase}' as phrase value instead.` )
        }

        let type
        if( url.startsWith( 'data:application/json;base64,' ) ) {
            type = 'dataurl'
        } else if( url.startsWith( 'https://' ) ) {
            type = 'url'
        } else if( url.startsWith( 'local://' ) ){
            type = 'local'
        }

        let result
        let response
        switch( type ) {
            case 'dataurl':
                response = await axios.get( url, { 'responseType': 'arraybuffer' } )
                const base64Data = response.data.toString( 'base64' )
                const jsonDataString = Buffer.from( base64Data, 'base64' ).toString( 'utf-8' )
                result = JSON.parse( jsonDataString )
                break
            case 'url':
                response = await axios.get( url )
                if( response.data.startsWith( 'data:application/json;base64,' ) ) {
                    response = await axios.get(response.data, { 'responseType': 'arraybuffer' } )
                    const base64Data = response.data.toString( 'base64' )
                    const jsonDataString = Buffer.from( base64Data, 'base64' ).toString( 'utf-8' )
                    result = JSON.parse( jsonDataString )
                }
                break
            case 'local':
                url = url.replace( 'local://', '' )
                const __filename = fileURLToPath( import.meta.url )
                const __dirname = path.dirname( __filename )
                const p = `${__dirname}/import/templates/${url}.txt`
                // const p = `./src/import/templates/${url}.txt`
                if( fs.existsSync( p ) ) {
                    try {
                        const dataurl = fs.readFileSync( p, 'utf-8' )
                        response = await axios.get( dataurl, { 'responseType': 'arraybuffer' } )
                        const base64Data = response.data.toString( 'base64' )
                        const jsonDataString = Buffer.from( base64Data, 'base64' ).toString( 'utf-8' )
                        result = JSON.parse( jsonDataString )
                    } catch( e ) {
                        console.log( e )
                        process.exit( 1 )
                    }
                } else {
                    console.log( `Path '${p}' not found.` )
                    process.exit( 1 )
                }
                break
            default:
                console.log( 'Content unknown!.' )
                process.exit( 1 )
                break
        }

    
        if( result['encrypt'] ) {
            const encrypt = new Encryption()
            result['content'] = encrypt
                .setSecret( { 'secret': phrase, 'secure': false } )
                .decrypt( { 'hash': result['content'] } )
            result['content'] = JSON.parse( result['content'] )
        }
// console.log( 'res', result )
        const importJson = result['content']
        this.#projectImporter.createImport( { importJson, projectName } )

        return true
    }


    async createAccounts( { names, networkName, groupName, pattern=true } ) {
        const [ messages, comments ] = this.#validateCreateAccount( { 'name': 'placeholder', names, groupName, pattern, networkName } )
        printMessages( { messages, comments } )

        this.setEnvironment()
        // this.#environment.updateFolderStructure( { 'folderType': 'credentials' } )
        const missingNames = this.#getMissingAccounts( { names, groupName } )
        const deployers = []
        for( let i = 0; i < missingNames.length; i++ ) {
            const [ name, groupName ] = missingNames[ i ]
            const deployer = await this.createAccount( {
                name,
                groupName,
                pattern,
                networkName
            } )
            deployers.push( deployer )
        }

        return deployers
    }


    async createAccount( { name, groupName, networkName, pattern=true } ) {
        const [ messages, comments ] = this.#validateCreateAccount( { name, groupName, pattern, networkName } )
        printMessages( { messages, comments } )

        let deployer
        const accounts = this.getAccounts()
        if( Object.hasOwn( accounts, groupName ) ) {
            if( Object.hasOwn( accounts[ groupName ], name ) ) {
                const txt = fs.readFileSync( accounts[ groupName ][ name ]['filePath'], 'utf-8' )
                const existing = JSON.parse( txt )
                const existingDeployer = this.#encryption
                    .decryptCredential( { 'credential': existing } )
                return existingDeployer
            }
        }

        const encrypt = this.#state['encryption']
        const account = this.#account

        const id = this.#state['secretId']
        deployer = await account
            .create( { name, groupName, pattern, networkName, encrypt, id } )

        const fileContent = this.#encryption
            .encryptCredential( { 'credential': deployer } )

        let path = [
            this.#config['validate']['folders']['credentials']['name'],
            this.#config['validate']['folders']['credentials']['subfolders']['accounts']['name'],
            `${name}--${moment().unix()}.json`
        ]
            .join( '/' )
 
        fs.writeFileSync( 
            path, 
            JSON.stringify( fileContent, null, 4 ), 
            'utf-8'
        )

        return deployer
    }


    getTemplateNames() {
        let result = []
        const __filename = fileURLToPath( import.meta.url )
        const __dirname = path.dirname( __filename )
        const folderPath = `${__dirname}/import/templates/`
        if( !fs.existsSync( folderPath ) ) {
        } else {
            result = fs
                .readdirSync( folderPath )
                .map( a => a.split( '.' )[ 0 ] )
        }
        return result
    }


    getProjectNames() {
        const path = this.#config['validate']['folders']['workdir']['name']
        const projectNames = fs
            .readdirSync( path )
            .map( folder => {
                return {
                    'path': `${path}/${folder}`,
                    'projectName': folder
                }
            } )
            .filter( a => fs.statSync( a['path'] ).isDirectory() )
            .map( a => a['projectName'])

        return projectNames
    }


    getDevelopmentContracts() {
        return this.#environment
            .getDevelopmentContracts()
    }


    getDevelopmentContract( { name, projectName } ) {
        const contracts = this.getDevelopmentContracts()

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


    async getDeployedContract( { name, projectName } ) {
        const deployedContracts = this.getDeployedContracts()
        const [ messages, comments ] = this.#validateGetDeployedContract( { name, projectName, deployedContracts } )
        printMessages( { messages, comments } )

        const header = deployedContracts[ projectName ][ name ]
        const classes = this.#contract.getDeployedContract( { 
            'filePath': header['filePath'],
            'encryption': this.#encryption
        } )

        const result = { ...header, ...classes }
        return result
    }


    getAccounts() {
        const accounts = this.#environment.getAccounts( { 
            'account': this.#account, 
            'encrypt': this.#encryption 
        } )

        return accounts 
    }


    async getAccount( { name, groupName, checkStatus=false, strict=false } ) {
        const accounts = this.getAccounts()
        const [ messages, comments ] = this.#validateGetAccount( { name, groupName, accounts, checkStatus, strict } )
        printMessages( { messages, comments } )

        const selection = accounts[ groupName ][ name ]
        const result = {
            'filePath': selection['filePath'],
            'privateKey': {
                'field': null,
                'base58': null
            },
            'publicKey': {
                'field': null,
                'base58': null
            },
            'balance': null,
            'nonce': null,
            'explorer': null
        }

        if( checkStatus ) {
            const data = await this.getAccountStatus( { 
                'publicKey': selection['addressFull'],
                'networkName': selection['networkName']
            } ) 

            if( data['status']['code'] !== 200 ) {
                console.log( `${data['status']['message']} Check for pending transactions: ${selection['faucetTxHashExplorer']}.` )
                strict ? process.exit( 1 ) : ''
            } else if( !data['success'] ) {
                console.log( `Balance not found. Check for pending transactions: ${selection['faucetTxHashExplorer']}.` )
                strict ? process.exit( 1 ) : ''
            } else {
                result['balance'] = data['balance']
                result['nonce'] = data['nonce']
            }
        }

        let credential = JSON.parse( fs.readFileSync( selection['filePath'], 'utf-8' ) )
        credential = this.#encryption.decryptCredential( { credential } )

        result['privateKey']['base58'] = credential['body']['account']['privateKey']
        result['privateKey']['field'] = PrivateKey.fromBase58( result['privateKey']['base58'] )

        result['publicKey']['field']  = result['privateKey']['field'].toPublicKey()
        result['publicKey']['base58'] = result['publicKey']['field'].toBase58()

        result['explorer'] = credential['header']['explorer']

        return result
    }


    async getAccountStatus( { publicKey, networkName } ) {
        const [ messages, comments ] = this.#validateGetAccountStatus( { publicKey, networkName } )
        printMessages( { messages, comments } )

        const data = await this.#minaData.getData( { 
            'preset': 'accountBalance', 
            'userVars': { publicKey },
            'network': 'berkeley'
        } )

        const account = {
            'status': {
                'code': null,
                'message': null
            },
            'balance': null,
            'nonce': null,
            'success': false
        }

        if( data['status']['code'] !== 200 ) {
            account['status']['code'] = 503
            account['status']['message'] = `Network Error, could not fetch information for '${shortenAddress( { publicKey }) }' on '${networkName}'.`
        } else if( data['data']['account'] === null ) {
            account['status']['code'] = 400
            account['status']['message'] = `PublicKey '${shortenAddress( { publicKey }) }' on '${networkName}' is unknown.`
        } else {
            account['status']['code'] = 200
        }

        try {
            if( account['status']['code'] === 200 ) {
                account['success'] = [
                    [ data['data']['account']['balance']['total'], 'balance' ],
                    [ data['data']['account']['nonce'], 'nonce' ] 
                ]
                    .map( a => {
                        const [ value, key ] = a
                        if( value !== undefined ) {
                            account[ key ] = value
                            return true
                        } else {
                            return false
                        }
                    } ) 
                    .every( a => a )
            }
        } catch( e ) {}
        return account
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


    async saveContract( { response, verificationKey } ) {
        const [ messages, comments ] = this.#validateSaveContract( { response, verificationKey } )
        printMessages( { messages, comments } )

        const result = await this.#contract.prepareSave( { 
            'encryption': this.#encryption 
        } )

        const networkName = result['header']['networkName']
        try {            
            result['header']['txHash'] = response.hash()
            result['header']['txHashExplorer'] = this.#config['networks'][ networkName ]['explorer']['transaction']
                .replace( '{{txHash}}', result['header']['txHash'] )

            if( response['isSuccess'] === true ) {
                result['header']['txHashSuccess'] = response['isSuccess']
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
            } else {
                console.log( `The transaction did not succeed, and the contract was not saved.` )
                if( Object.hasOwn( response, 'errors' ) ) {
                } else if( Array.isArray( response['errors'] ) ) {
                    response['errors']
                        .forEach( msg => {
                            switch( msg['statusText'] ) {
                                case "Couldn't send zkApp command: [\"Insufficient_replace_fee\"]":
                                    console.log( 'Did you cu')
                                    break
                                default:
                                    break
                            }
                        } )
                }
            }

        } catch( e ) {
            result['header']['txHash'] = null
            result['header']['txHashExplorer'] = null
        }

        return result
    }


    async loadModuleExperimental( { sourceCode } ) {
        const tmpAbsolutePath = path.resolve(
            path.dirname( process.argv[ 1 ] ), 
            `tmp-${moment().unix()}.mjs`
        )

        fs.writeFileSync( tmpAbsolutePath, sourceCode, 'utf-8' )
        const _module = await import( tmpAbsolutePath )
        fs.unlinkSync( tmpAbsolutePath )

        return _module
    }


    startServer( { projectName } ) {
        // console.log( `Start server for '${this.#state['projectName']}'.` )
        const server = new Server( {
            'server': this.#config['server'],
            'validate': this.#config['validate']
        } )

        server
            .init( {
                projectName, // this.#state['projectName'],
                'environment': this.#environment,
                'account': this.#account, 
                'encrypt': this.#encryption
            } )
            .start()

        return true
    }


    #getMissingAccounts( { names, groupName } ) {
        const availableDeyployers = this.#environment.getAccounts( { 
            'account': this.#account, 
            'encrypt': this.#encryption 
        } )

        const missingNames = names
            .map( name => [ name, groupName ] )
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

/*
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
*/

    #validateInit( cfg ) {
        const messages = []
        const comments = []

        if( cfg === undefined ) {
            messages.push( `Key 'cfg' is type of 'undefined'.` )
        } else if( cfg.constructor !== Object ) {
            messages.push( `Key 'cfg' with the value '${cfg}' is not type of 'object'.` )
        }

        if( messages.length !== 0 ) {
            return [ messages, comments ]
        }

        if( !Object.hasOwn( cfg, 'encryption' ) ) {
            messages.push( `Key 'encryption' with the type of 'boolean' is missing.` )
        } else if( typeof cfg['encryption'] !== 'boolean' ) {
            messages.push( `Key 'encryption' with the value '${cfg['encrpytion']}' is not type of 'boolean'.` )
        }

        return [ messages, comments ]
    }


    #validateCreateAccount( { name, names=null, groupName, pattern, networkName } ) {
        const messages = []
        const comments = []

        const tests = []
        name !== null ? tests.push( [ name, 'name', 'stringsAndDash' ] ) : ''
        groupName !== null ? tests.push( [ groupName, 'groupName', 'stringsAndDash' ] ) : ''

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
                .forEach( ( value ) => {
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
            messages.push( `Key 'networkName' with the value '${networkName}' is not a valid input. Supported networks are ${this.#config['networks']['supported'].map( a => `'${a}'`).join( ',' )}.` )
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
            messages.push( `Key 'projectName' with the value '${projectName}' is not valid. Choose from ${Object.keys( contracts ).map( a => `'${a}'`).join( ', ' )} instead.` )
        }

        if( messages.length !== 0 ) {
            return [ messages, comments ]
        }

        const keys = Object.keys( contracts[ projectName ] )
        if( !keys.includes( name ) ) {
            messages.push( `Key 'name' with the value '${name}' is not valid. Choose from ${keys.map( a => `'${a}'`).join( ', ' )} instead.` )
        }

        return [ messages, comments ]
    }


    #validateGetAccount( { name, groupName, accounts, checkStatus, strict } ) {
        const messages = []
        const comments = []

        if( typeof name !== 'string' ) {
            messages.push( `Key 'name' is not type of 'string'.` )
        } 

        if( typeof groupName !== 'string' ) {
            messages.push( `Key 'groupName' is not type of 'string'.` )
        } else if( !Object.keys( accounts ).includes( groupName ) ) {
            messages.push( `Key 'groupName' with the value '${groupName}' is not valid. Choose from ${Object.keys( accounts ).map( a => `'${a}'`).join( ', ' )} instead.` )
        }

        if( messages.length !== 0 ) {
            return [ messages, comments ]
        }

        if( !Object.keys( accounts[ groupName ] ).includes( name ) ) {
            messages.push( `Key 'name' with the value '${name}' is not valid. Choose from ${Object.keys( accounts[ groupName ] ).map( a => `'${a}'`).join( ', ' )} instead.` )
        }

        const tmp = [ 
            [ checkStatus, 'checkStatus' ], 
            [ strict, 'strict' ] 
        ]
            .forEach( a => {
                const [ value, key ] = a
                if( typeof value !== 'boolean' ) {
                    messages.push( `Key '${key}' is not type of 'boolean'.` )
                }
            } )

        return [ messages, comments ]
    }


    #validateGetAccountStatus( { publicKey, networkName } ) {
        const messages = []
        const comments = []

        if( publicKey === undefined ) {
            messages.push( `Key 'publicKey' is type of 'undefined'.` )
        } else if( typeof publicKey !== 'string' ) {
            messages.push( `Key 'publicKey' is not type of 'string'.`)
        } else if( !this.#config['validate']['values']['minaPublicKey']['regex'].test( publicKey ) ) {
            messages.push( `Key 'publicKey' with the value '${publicKey}' is not a valid publicKey string. ${this.#config['validate']['values']['minaPublicKey']['description']}` )
        }

        if( publicKey === undefined ) {
            messages.push( `Key 'networkName' is type of 'undefined'.` )
        } else if( typeof networkName !== 'string' ) {
            messages.push( `Key 'networkName' is not type of string.` )
        } else if( !this.#config['networks']['supported'].includes( networkName ) ) {
            messages.push( `Key 'networkName' with the value '${networkName}' is not a valid input. Supported networks are ${this.#config['networks']['supported'].map( a => `'${a}'`).join( ',' )}.` )
        }

        return [ messages, comments ]
    }


    #validateSaveContract( { response, verificationKey } ) {
        const messages = []
        const comments = []

        const tmp = [
            [ response, 'response' ],
            [ verificationKey, 'verificationKey' ]
        ]
            .forEach( a => {
                const [ value, key ] = a
                if( typeof value === undefined ) {
                    messages.push( `Key '${key}' is type of 'undefined'.` )
                } else if( typeof value !== 'object' ) {
                    messages.push( `Key '${key}' is not type of 'object'.` )
                } else if( value.constructor !== Object ) {
                    messages.push( `Key '${key}' with the constructor type '${value.constructor}' is not valid, use 'Object'.` ) 
                }
            } )

        if( messages.length !== 0 ) {
            return [ messages, comments ]
        }

        if( !Object.hasOwn( response, 'isSuccess' ) ) {
            messages.push( `Key 'response' has not a key/value pair 'isSuccess'.` )
        } else if( typeof response['isSuccess'] !== 'boolean' ) {
            messages.push( `Key 'response' with the key/value pair 'isSuccess' is not type of 'boolean'.` )
        }

        const test = [ [ 'data' ], [ 'hash' ] ]
            .forEach( a => {
                const [ key ] = a
                if( !Object.hasOwn( verificationKey[ key ], key ) ) {
                    messages.push( `Key 'verificationKey' has not a key/value pair '${key}'.` )
                }
            } )

        return [ messages, comments ]
    }


    #validateGetDeployedContract( { name, projectName, deployedContracts } ) {
        const messages = []
        const comments = []

        const tmp = [
            [ name, 'name' ],
            [ projectName, 'projectName' ]
        ]
            .forEach( a => {
                const [ value, key ] = a
                if( value === undefined ) {
                    messages.push( `Key '${key}' is 'undefined'. ` )
                } else if( typeof value !== 'string' ) {
                    messages.push( `Key '${key}' is type of 'string'.` )
                } else if( !this.#config['validate']['values']['stringsAndDash']['regex'].test( name ) ) {
                    messages.push( `Key '${key}' with the value '${value}' has not a valid pattern. ${this.#config['validate']['values']['stringsAndDash']['description']}`)
                } 
            } )

        if( messages.length !== 0 ) {
            return [ messages, comments ]
        }

        if( !Object.hasOwn( deployedContracts, projectName ) ) {
            messages.push( `Key 'projectName' with the value '${projectName}' is not found.` )
        } else if( !Object.hasOwn( deployedContracts[ projectName ], name ) ) {
            messages.push( `Key 'name' with the value '${name}' and 'projectName' with the value '${projectName}' is not found in the contracts folder.` )
        }

        return [ messages, comments ]
    }
}