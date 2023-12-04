import inquirer from 'inquirer'
import figlet from 'figlet'


export class CLI {
    #config

    constructor() {
        this.#config = {}

        return true
    }

    
    async start() {
        this.#addHealine()



        return true
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
}