import inquirer from 'inquirer'
import figlet from 'figlet'

import { EasyMina } from './EasyMina.mjs'


export class CLI {
    #config
    #easyMina

    constructor() {
        this.#config = {}
        this.#easyMina = new EasyMina()
        this.#easyMina.init()


        return true
    }

    
    async start() {
        this.#addHeadline2()
        await this.#createEnvironment()
        return true
    }


    async #createEnvironment() {
        const status = this.#easyMina.getEnvironment()
        if( status['environmentReady'] ) {
            console.log( 'Environment ready.' )
        } else {
            console.log( 'The following directories are missing, should they be created?' )
            Object
                .entries( status['folders'] )
                .filter( a => !a[ 1 ]['status'] )
                .forEach( a => console.log( `- ${a[ 1 ]['path']}` ))
            const response = await inquirer.prompt( [
                {
                  'type': 'confirm',
                  'name': 'sure',
                  'message': 'Yes/No',
                  'default': true
                }
            ] )

            if( !response['sure'] ) {
                process.exit( 1 )
            }



            console.log( response )
        }


        console.lo
    }


    async #areYouSure( { msg } ) {
        const response = await inquirer.prompt( [
            {
              'type': 'confirm',
              'name': 'sure',
              'message': msg,
              'default': true
            }
        ] )
        return response
    }


    #addHealine() {
        console.log(
            figlet.textSync(
                "Easy Mina", 
                {
                    font: "big",
                    horizontalLayout: "default",
                    verticalLayout: "default",
                    width: 100,
                    whitespaceBreak: true,
                } 
            )
        )
        return true
    }


    #addHeadline2() {
        console.log(
            `
-- - - - - - --*-- - - - - - --
|       ___           ___       |
|      /\\  \\         /\\__\\      |
|     /::\\  \\       /::|  |     |
|    /:/\\:\\  \\     /:|:|  |     |
|   /::\\~\\:\\  \\   /:/|:|__|__   |
|  /:/\\:\\ \\:\\__\\ /:/ |::::\\__\\  |
|  \\:\\~\\:\\ \\/__/ \\/__/~~/:/  /  |
|   \\:\\ \\:\\__\\         /:/  /   |
|    \\:\\ \\/__/        /:/  /    |
|     \\:\\__\\         /:/  /     |
|      \\/__/         \\/__/      |
|                               |
-- - -- E a s y M i n a -- - -- 
| change the world with zk tech |  
---------------------------------  
`
        )
    }
}