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
        this.#state = this.#addState()
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


    #addState() {
        const state = {
            'accounts': null,
            'contracts': null,
            'localO1js': null,
            'smartContracts': null
        }

        state['accounts'] = [ 'Account1', 'Account2', 'Account3' ]
        state['contracts'] = [ 'Contract1', 'Contract2', 'Contract3' ]
        state['localO1js'] = './node_modules/o1js/dist/web/index.js'
        state['smartContracts'] = [ 'SmartContract1', 'SmartContract2', 'SmartContract3' ]

        return state
    }


    #addRoutes( { projectName } ) {
        const [ messages, comments ] = this.#validateAddRoutes( { projectName } ) 
        printMessages( { messages, comments } )

        this.#addRouteBuild()
        // this.#addRoutePublic()
        // this.#addRouteGetAccounts()
        // this.#addRouteGetContracts()
        // this.#addRouteGetLocalO1js()
        // this.#addRouteGetSmartContracts()
        
        return true
    }


    #validateAddRoutes( { projectName } ) {
        const messages = []
        const comments = []

        const buildFolder = './build'
        const workdirFolder = './' + this.#config['validate']['folders']['workdir']['name']
        const projectFolder = workdirFolder + '/' + `${projectName}`
        const frontendFolder = projectFolder + '/' + this.#config['validate']['folders']['workdir']['subfolders']['subfolders']['frontend']['name']

        if( !fs.existsSync( buildFolder ) ) {
            messages.push( `Build folder '${buildFolder}' is not found.` )
        }

        if( !fs.existsSync( workdirFolder ) ) {
            messages.push( `Workdir '${workdirFolder}' does not exist.` )
        } else if( !fs.existsSync( projectFolder ) ) {
            messages.push( `Project Folder '${projectFolder}' does not exist.` )
        } else if( !fs.existsSync( frontendFolder ) ) {
            messages.push( `In Project Folder '${projectFolder}' the subfolder '${this.#config['validate']['folders']['workdir']['subfolders']['subfolders']['frontend']['name']}' does not exist.` )
        }

        return [ messages, comments ]
    }


    #addRouteBuild() {
        this.#app.use(
            '/build', 
            express.static( './build' )
        )

        return true
    }


    #addRoutePublic() {
        this.#app.use(
            '/public', 
            './workdir/hello-world/frontend'
        )

        return true
    }


    #addRouteGetAccounts() {
        this.#app.get(
            '/getAccounts', 
            ( req, res ) => { res.json( { 'data': this.#state['accounts'] } ) }
        )

        return true
    }


    #addRouteGetContracts() {
        this.#app.get(
            '/getContracts',
            ( req, res ) => { res.json( { 'data': this.#state['contracts'] } ) }
        )

        return true
    }


    #addRouteGetLocalO1js() {
        this.#app.get(
            '/getLocalO1js', 
            ( req, res ) => {
                if( fs.existsSync( this.#state['localO1js'] ) ) {
                    const fileContent = fs.readFileSync( this.#state['localO1js'], 'utf-8' )
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
            '/getSmartContracts', 
            ( req, res ) => { res.json( { 'data': this.#state['smartContracts'] } ) }
        )

        return true
    }
}