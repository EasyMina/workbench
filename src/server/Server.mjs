import express from 'express'
import path from 'path'
import fs from 'fs'

import { printMessages } from './../helpers/mixed.mjs'


export class Server {
    #config
    #app
    #state


    constructor( { server, validate } ) {
        this.#config = { server, validate }
    }


    init( { projectName } ) {
        this.#app = express()

        this.#state = this.#addState( { projectName } )
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


    #addState( { projectName } ) {
        const state = {
            'accounts': null,
            'contracts': null,
            'localO1js': null,
            'smartContracts': null,
            'buildFolder': null,
            'publicFolder': null
        }

        state['accounts'] = [ 'Account1', 'Account2', 'Account3' ]
        state['contracts'] = [ 'Contract1', 'Contract2', 'Contract3' ]
        state['localO1js'] = './node_modules/o1js/dist/web/index.js'
        state['smartContracts'] = [ 'SmartContract1', 'SmartContract2', 'SmartContract3' ]

        state['publicFolder'] = './'
        state['publicFolder'] += this.#config['validate']['folders']['workdir']['name'] + '/'
        state['publicFolder'] += `${projectName}/`
        state['publicFolder'] += this.#config['validate']['folders']['workdir']['subfolders']['subfolders']['frontend']['name']

        state['buildFolder'] = this.#config['server']['routes']['build']['source']

        return state
    }


    #validateState() {
        const messages = []
        const comments = []

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
        // this.#addRoutePublic()
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


    #addRoutePublic() {
        console.log( '>>>', this.#config['server']['routes']['public']['route'] )
        console.log( '>>>', this.#state['publicFolder'] ) 
        this.#app.use(
            this.#config['server']['routes']['public']['route'], 
            this.#state['publicFolder']
        )

        return true
    }


    #addRouteGetAccounts() {
        this.#app.get(
            this.#config['server']['routes']['getAccounts']['route'], 
            ( req, res ) => { res.json( { 'data': this.#state['accounts'] } ) }
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
            ( req, res ) => { res.json( { 'data': this.#state['smartContracts'] } ) }
        )

        return true
    }
}