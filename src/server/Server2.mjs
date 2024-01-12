import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { marked } from 'marked'
import axios from 'axios'
import { Markdown } from './Markdown.mjs'

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
    #markdown
    

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
        this.#markdown = new Markdown()

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
        state['absoluteRoot'] = process.cwd() // this.#getRootAbsolutePath()['result']

        state['accounts'] = [ 'Account1', 'Account2', 'Account3' ]
        state['contracts'] = [ 'Contract1', 'Contract2', 'Contract3' ]
        state['localO1js'] = `${state['absoluteRoot']}/node_modules/o1js/dist/web/index.js`
        state['smartContracts'] = [ 'SmartContract1', 'SmartContract2', 'SmartContract3' ]

        state['publicFolder'] = ''
        state['publicFolder'] += state['absoluteRoot'] + '/'
        state['publicFolder'] += this.#config['validate']['folders']['workdir']['name'] + '/'
        state['publicFolder'] += `${projectName}/`
        state['publicFolder'] += this.#config['validate']['folders']['workdir']['subfolders']['subfolders']['frontend']['name']

        state['buildFolder'] = ''
        state['buildFolder'] += state['absoluteRoot'] + '/'
        state['buildFolder'] += this.#config['validate']['folders']['workdir']['name'] + '/'
        state['buildFolder'] += `${projectName}/`
        state['buildFolder'] += this.#config['validate']['folders']['workdir']['subfolders']['subfolders']['contracts']['name'] + '/'
        state['buildFolder'] += this.#config['server']['routes']['build']['source']

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
        // this.#addRouteOverview()
        // this.#addRoutePublic()

        this.#addApiGetAccounts()
        this.#addApiGetContracts()
        this.#addApiGetLocalO1js()

        this.#addRouteIndex()
        // this.#addRouteGetSmartContracts()
        
        return true
    }


    #addRouteIndex() {
        const accountTables = this.#markdown
            .createAccountGroupTables( { 
                'environment': this.#environment,
                'account': this.#account, 
                'encrypt': this.#encrypt
            } )   
            
        const projectTables = this.#markdown
            .createProjects( { 
                'environment': this.#environment
             } )
        
        const scripts = this.#environment
            .getScripts()

        this.#app.get(
            '/',
            ( req, res ) => {
                const _insert = overview
                    .replace( '{{accountTables}}', accountTables )
                    .replace( '{{projects}}', projectTables )
                const html = this.#container
                    .replace( '{{markdown}}', marked( _insert ) )

                return res.send( html )
            }
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


    #addApiGetAccounts() {
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


    #addApiGetContracts() {
        this.#app.get(
            this.#config['server']['routes']['getContracts']['route'],
            ( req, res ) => { 
                const contracts = this.#environment.getContracts()
                res.json( { 'data': contracts } ) 
            }
        )

        return true
    }


    #addApiGetLocalO1js() {
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
}