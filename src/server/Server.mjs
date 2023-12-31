import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { marked } from 'marked'
import axios from 'axios'


import { html, css } from './templates/html.mjs'
import { frontend, overview } from './templates/index.mjs'

import fs from 'fs'
import { printMessages } from './../helpers/mixed.mjs'


export class Server {
    #config
    #app
    #state
    #container
    #environment
    #account
    #encrypt
    

    constructor( { server, validate } ) {
        this.#config = { server, validate }
        return true
    }


    init( { projectName, environment, account, encrypt } ) {
        this.#app = express()
        this.#state = this.#addState( { projectName } )
        this.#container = this.#addContainer()
        this.#environment = environment
        this.#account = account
        this.#encrypt = encrypt

        const [ messages, comments ] = this.#validateState( { 'state': this.#state } )
        printMessages( { messages, comments } )

        this.#addRoutes( { projectName } )

        return this
    }


    start() {
        this.#app.listen(
            this.#config['server']['port'], 
            () => {
                let msg = ''
                msg += `EasyMina Server is running on port `
                msg += `http://localhost:${this.#config['server']['port']}`
                console.log( msg )
            } 
        )

        return true
    }


    #addContainer() {
        return html
            .replace( '{{style}}', css )
    }


    #addState( { projectName } ) {
        const state = {
            'projectName': null,
            'absoluteRoot': null,
            'accounts': null,
            'contracts': null,
            'localO1js': null,
            'smartContracts': null,
            'buildFolder': null,
            'publicFolder': null
        }

        state['projectName'] = projectName
        state['absoluteRoot'] = this.#getRootAbsolutePath()['result']

        state['accounts'] = [ 'Account1', 'Account2', 'Account3' ]
        state['contracts'] = [ 'Contract1', 'Contract2', 'Contract3' ]
        state['localO1js'] = './node_modules/o1js/dist/web/index.js'
        state['smartContracts'] = [ 'SmartContract1', 'SmartContract2', 'SmartContract3' ]

        state['publicFolder'] = ''
        state['publicFolder'] += state['absoluteRoot'] + '/'
        state['publicFolder'] += this.#config['validate']['folders']['workdir']['name'] + '/'
        state['publicFolder'] += `${projectName}/`
        state['publicFolder'] += this.#config['validate']['folders']['workdir']['subfolders']['subfolders']['frontend']['name']

        state['buildFolder'] = this.#config['server']['routes']['build']['source']

        return state
    }


    #validateState() {
        const messages = []
        const comments = []

        if( this.#state['absoluteRoot'] === null ) {
            messages.push( `No 'package.json' file in root detected. 'npm init -y' ?. ` )
        }

        const tmp = [
            [ 'publicFolder', 'folder', true ],
            [ 'buildFolder', 'folder', true ],
            [ 'localO1js', 'file', false ] 
        ]
            .forEach( a => {
                const [ key, type, required ] = a
                const path = this.#state[ key ]

                let msg = ''
                switch( type ) {
                    case 'folder':
                        if( !fs.existsSync( path ) ) {
                            msg = `Folder '${path}' is not a valid path.`
                        } else if( !fs.statSync( path ).isDirectory() ) {
                            msg = `Folder '${path}' is not a valid directory.`
                        }
                        break
                    case 'file':
                        if( !fs.existsSync( path ) ) {
                            msg = `File '${path}' is not a valid path.`
                        } else if( !fs.statSync( path ).isFile() ) {
                            msg = `File '${path}' is not a valid file.`
                        }
                        break
                    default:
                        console.log( `Unknown type with value '${type}'.` )
                        process.exit( 1 )
                        break
                }
                
                if( msg !== '' ) {
                    if( required ) {
                        messages.push( msg )
                    } else {
                        comments.push( msg )
                    }
                }
            } )

        return [ messages, comments ]
    }


    #addRoutes( { projectName } ) {
        // this.#addRouteBuild()
        this.#addRouteOverview()
        this.#addRoutePublic()
        this.#addRouteGetAccounts()
        this.#addRouteGetContracts()
        this.#addRouteGetLocalO1js()
        // this.#addRouteGetSmartContracts()
        
        return true
    }


    #addRouteBuild() {
        this.#app.use(
            this.#config['server']['routes']['build']['route'], 
            express.static( this.#state['buildFolder'] )
        )

        return true
    }


    #getRootAbsolutePath() {
        const __filename = fileURLToPath( import.meta.url )
        const __dirname = path.dirname( __filename )
        const root = new Array( 10 )
            .fill()
            .reduce( ( acc, a ) => {
                try {
                    acc['_acc'] = path.resolve( acc['_acc'], '..' )
                    const files = fs.readdirSync( acc['_acc'] )
                    if( files.includes( 'package.json' ) ) {
                        const tmp = fs.readFileSync( `${acc['_acc']}/package.json` )
                        const json = JSON.parse( tmp )
                        if( 
                            Object.hasOwn( json, 'main' ) && 
                            acc['result'] === null 
                        ) {
                            acc['result'] = acc['_acc']
                        }
                    }
                } catch( e ) {}
                return acc
            }, { '_acc': __dirname, 'result': null } )
    
        return root
    }


    #createFrontendOverview() {
        const table = [ 'Name', 'Source', 'Readme' ]
        const files = fs.readdirSync( this.#state['publicFolder'] )

        const frontendMd = files
            .filter( a => a.endsWith( '.html' ) )
            .reduce( ( acc, fileName, index ) => {
                if( index === 0 ) {
                    acc += `| ${table.map( a => a ).join( ' | ' )} |  \n`
                    acc += `| ${table.map( a => `:--` ).join( ' | ' )} |  \n`
                }

                acc += `| `
                acc += table
                    .map( column => {
                        let str
                        switch( column ) {
                            case 'Name':
                                str = fileName
                                break
                            case 'Source':
                                str = `[X](./${fileName})`
                                break
                            case 'Readme':
                                const search = `${fileName.substring( 0, fileName.length - 5 )}.md`
                                console.log( 's', search )
                                if( files.includes( search ) ) {
                                    str = `[X](./${search})`
                                } else {
                                    str = ''
                                }

                                break
                            default:
                                console.log( 'Error' )
                                break
                        }
                        return str
                    } )
                    .join( ' | ')
                acc += ` |  \n`
    
                return acc
            }, '' )

        const markdown = [
            [ '{{frontend}}', frontendMd ]
        ]
            .reduce( ( acc, a, index, all ) => {
                acc = acc.replace( a[ 0 ], a[ 1 ] )
                if( all.length -1 === index ) {
                    acc = acc
                        .replace( '{{projectName}}', this.#state['projectName'] )
                    acc = marked( acc )
                }
                return acc
            }, frontend )

        const result = this.#container
            .replace( '{{markdown}}', markdown )

        return result
    }


    #addRouteOverview() {
        this.#app.get(
            '/',
            async ( req, res ) => {
                const accounts = await axios.request( {
                    'method': 'get',
                    'maxBodyLength': Infinity,
                    'url': 'http://localhost:3001/getAccounts',
                    'headers': { }
                } )

                const rows = [ 'name', 'address', 'balance', 'pending', 'berkeley', 'testnet2' ]
                const tables = Object
                  .entries( accounts['data']['data'] )
                  .reduce( ( acc, a, index ) => {
                    const [ key, value ] = a
                    acc += `Group ${key}  \n`
                    acc += Object
                        .entries( value )
                        .reduce( ( abb, b, rindex ) => {
                            const [ k, v ] = b
                            if( rindex === 0 ) {
                                abb += `| ${rows.join( ' | ' )} |  \n`
                                abb += `| ${new Array( rows.length).fill().map( a => ':--' ).join( ' | ' )} |  \n`
                            }

                            const row = [ 
                                k, 
                                `${v['publicKey'].slice(0, 8)}...${v['publicKey'].slice(-4)}`, 
                                '<div id="balance"></div>',
                                '<div id="pending"></div>',
                                `[X](${v['explorer']['berkeley']})`,
                                `[X](${v['explorer']['testworld2']})`
                            ]

                            abb += `| ${row.join( ' | ' )} |  \n`

                            return abb
                        }, '' )
                    acc += '  \n'
                    acc += `  \n`

                    return acc
                  }, '' )


                const _insert = overview
                    .replace( '{{projectName}}', this.#state['projectName'] )
                    .replace( '{{accounts}}', tables )

                const html = this.#container
                    .replace( '{{markdown}}', marked( _insert ) )

                res.send( html )
            }
        )

        return true
    }


    #addRoutePublic() {
        this.#app.use(
            '/',
            express.static( this.#state['publicFolder'] + '/' )
        )

        this.#app.get(
            '/frontend/index.html', 
            ( req, res ) => { 
                const str = this.#createFrontendOverview()
                res.send( str )
            }
        ) 

        this.#app.get(
            '/frontend/', 
            ( req, res ) => { res.redirect( '/frontend/index.html' ) }
        )

        this.#app.get(
            '/frontend/:filename', 
            ( req, res ) => {
                const { filename } = req['params']
                const filePath = path.join( this.#state['publicFolder'], filename )

                if( filename.endsWith( '.md' ) ) {
                    try {
                        console.log( 'MD')
                        const data = fs.readFileSync( filePath, 'utf8' )
                        const htmlContent = marked( data )

                        const str = this.#container
                            .replace( '{{markdown}}', htmlContent )
                        res.send( str )
                    } catch( e ) {
                        console.log( 'e', e )
                        return res
                            .status( 500 )
                            .send( 'Error reading the file' )
                    }

                } else {
                    res.sendFile( filePath, ( err ) => {
                        if( err ) {
                          res
                            .status( 404 )
                            .send( 'File not found' )
                        }
                    } )
                }
        } )

        this.#app.get(
            '/frontend/*/*', 
            ( req, res ) => {
                const { 0: subfolder, 1: filename } = req.params
                if( !subfolder || !filename ) {
                    return res
                        .status( 400 )
                        .send( 'Invalid URL format' )
                }
            
                const filePath = path.join( 
                    this.#state['publicFolder'], 
                    subfolder, 
                    filename
                )

                try {
                    const data = fs.readFileSync( filePath, 'utf8' )
                    res.send( data )
                } catch( err ) {
                    console.error( 'Error reading the file:', err )
                    res
                        .status( 500 )
                        .send( 'Internal Server Error' )
                }
            } 
        )
        return true
    }


    #addRouteGetAccounts() {
        this.#app.get(
            this.#config['server']['routes']['getAccounts']['route'], 
            ( req, res ) => { 
                const availableDeyployers = this.#environment.getAccounts( { 
                    'account': this.#account, 
                    'encrypt': this.#encrypt 
                } )

                res.json( { 'data': availableDeyployers } ) 
            }
        )

        return true
    }


    #addRouteGetContracts() {
        this.#app.get(
            this.#config['server']['routes']['getContracts']['route'],
            ( req, res ) => { res.json( { 'data': this.#state['contracts'] } ) }
        )

        return true
    }


    #addRouteGetLocalO1js() {
        this.#app.get(
            this.#config['server']['routes']['getLocalO1js']['route'], 
            ( req, res ) => {
                if( fs.existsSync( this.#state['localO1js'] ) ) {
                    const fileContent = fs.readFileSync( 
                        this.#state['localO1js'], 
                        'utf-8' 
                    )
                    res.send( fileContent )
                } else {
                    res
                        .status( 404 )
                        .send( 'File not found' )
                }
            }
        )

        return true
    }


    #addRouteGetSmartContracts() {
        this.#app.get(
            this.#config['server']['routes']['getSmartContracts']['route'], 
            ( req, res ) => { 
                res.json( { 'data': this.#state['smartContracts'] } ) 
            }
        )

        return true
    }
}