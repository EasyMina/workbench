import { printMessages } from '../helpers/mixed.mjs'
import fs from 'fs'


export class ProjectImporter {
    #config


    constructor() {

    }


    async addProject( { projectPath } ) {
        const [ messages, comments ] = this.#validateAddProject( { projectPath } ) 
        printMessages( { messages, comments } )

        if( projectPath.startsWith( 'https://' ) ) {
            // public import here <<<---->>>
        } else {
            let path = `./templates/${projectPath}.mjs`
            try {
                // import * as data from `./templates/${projectPath}`
                const { struct } = await import( path )
                console.log( 'struct', struct )
            } catch( e ) {
                messages.push( `File '${path}' is not found.` )
            }
        }
        printMessages( { messages, comments } )

        const [ m, c ] = this.#validateImportStruct( { json } ) 
        printMessages( { 'messages': m, 'comments': c } )

        console.log( 'END' )

        return true
    }


    #validateAddProject( { projectPath } ) {
        const messages = []
        const comments = []

        if( typeof projectPath === 'undefined' ) {
            messages.push( `Key 'projectPath' is mssing.` )
        } else if( typeof projectPath !== 'string' ) {
            messages.push( `Key 'projectPath' is not type string.` )
        }

        return [ messages, comments ]
    }


    #validateImportStruct( { json } ) {
        const messages = []
        const comments = []

        

        return [ messages, comments ]
    }
}