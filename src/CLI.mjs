import inquirer from 'inquirer'
import figlet from 'figlet'

import { EasyMina } from './EasyMina.mjs'


export class CLI {
    #config
    #easyMina

    constructor() {
        this.#config = {}
        this.#easyMina = new EasyMina()
        this.#easyMina.init( { 
            encryption: true,
            setSecret: false
        })


        return true
    }

    
    async start() {
        this.#addHeadline2()

        await this.#isOkMenu()
        // await this.#createEnvironment()
        // await this.#addDeployer()
        // await this.#addProject()

        // await this.start()
        return true
    }


    async #isOkMenu() {
        const options = [
            'Add Accounts',
            'Add a Template',
            'Export/Import Project', 
            'Start Server'
        ]

        const questions = [
            {
                'type': 'list',
                'name': 'generalOption',
                'message': 'Choose an action:',
                'choices': options,
            }
        ]
          
        const response = await inquirer
            .prompt( questions )

        switch( response['generalOption'] ) {
            case 'Add Accounts':
                // TODO
                this.#addAccounts()
                break
            case 'Export/Import Project':
                await this.#chooseExportOrImport()
                // TODO
                break
            case 'Start Server':
                // TODO
                break
            default:
                break
        }


        return true
    }


    async #addAccounts() {
        const questions = [
            {
              type: 'input',
              name: 'names',
              message: 'Enter names (comma-separated):',
              validate: function (input) {
                const namesArray = input.split(',').map(name => name.trim());
                return namesArray.length > 0 ? true : 'Please enter at least one name.';
              },
            },
            {
              type: 'input',
              name: 'groupName',
              message: 'Enter the group name:',
              validate: function (input) {
                return input.trim() !== '' ? true : 'Please enter a non-empty group name.';
              },
            }
          ]
          
        const response = await inquirer
            .prompt( questions )
        // this.#easyMina.createAccounts( { names, networkName, groupName } )

        return true
    }



    async #chooseExportOrImport() {
        const options = [ 
            'Import', 
            'Export' 
        ]

        const questions = [
            {
                'type': 'list',
                'name': 'detailOption',
                'message': 'Choose a type',
                'choices': options,
            }
        ]
          
        const response = await inquirer
            .prompt( questions )

        switch( response['detailOption'] ) {
            case 'Import':
                this.#importPrject()
                break
            case 'Export':
                this.#exportProject()
                break
            default:
                break
        }

        return true
    }


    async #exportProject() {
        const projectNames = this.#easyMina.getProjectNames()

        const questions = [
            {
              type: 'list',
              name: 'projectName',
              choices: projectNames,
              message: 'Enter the project name:',
            },
            {
              type: 'input',
              name: 'name',
              message: 'Enter your name (optional):',
              default: ''
            },
            {
              type: 'input',
              name: 'description',
              message: 'Enter a project description (optional):',
                default: ''
            },
            {
              type: 'input',
              name: 'phrase',
              message: 'Enter an export phrase:',
              validate: function (input) {
                return input.trim() !== '' ? true : 'Please enter a non-empty export phrase.';
              },
            }
        ]
        
        const answers = await inquirer.prompt(questions);
        const { projectName, name, description, phrase } = answers

        const encryption = false
        this.#easyMina.exportProject( { projectName, name, description, phrase, encryption } )


          return true
    }


    async #importPrject() {
        const questions = [
            {
                'type': 'input',
                'name': 'url',
                'message': 'Enter an url:',
                validate: function (input) {
                    return input !== '' ? true : 'Please enter a url or dataurl.'
                },
            },
            {
                'type': 'input',
                'name': 'phrase',
                'message': 'Enter your decryption phrase:',
                validate: function (input) {
                    return input !== '' ? true : 'Please enter the secret phrase to decrypt your file.';
                },
            },
            {
                'type': 'input',
                'name': 'projectName',
                'message': 'Enter a Project Name:',
                validate: function (input) {
                    return input !== '' ? true : 'Please enter the secret phrase to decrypt your file.';
                },
            }
        ]
          
        const response = await inquirer.prompt( questions )
        const { url, phrase, projectName } = response

        this.#easyMina.importProject( { url, phrase, projectName } )
        return true 
    }



    async #addProject() {
        const resul = this.#easyMina.exportProject( { projectName: 'project-a' } )

        const result = await this.#easyMina.importProject( { 
            'url': 'hello-world',
            //'url': 'https://gist.githubusercontent.com/a6b8/a05d605f04972e67eccf998587b9471a/raw/089553e6e8e071f3e149be02bbacb7e42b727483/gistfile1.txt',
            // 'phrase': 'test'
        } )

        console.log( 'r', result )
        process.exit( 1 )

        const projects = this.#easyMina.getProjectsNames()
        if( projects.length !== 0 ) {
            console.log( `${projects.length} Project${projects.length === 1 ? '' : 's'} found.` )
            return true
        }

        console.log( `No project found. Would you like to load an example?` )
        const response = await inquirer.prompt( [
            {
                'type': 'confirm',
                'name': 'sure',
                'message': 'Yes/No',
                'default': true
            }
        ] )

        console.log( 'HERE' )
        this.#easyMina.createExport()
        // console.log( projects )
        return true
    }


    async #addDeployer() {
        const accounts = this.#easyMina.getAccounts()
        if( Object.keys( accounts ).length !== 0 ) {
            const accountsArr = Object
                .entries( accounts )
                .reduce( ( acc, a, index ) => {
                    const [ groupName, value ] = a
                    Object
                        .entries( value )
                        .forEach( b => {
                            const [ name, v ] = b
                            acc.push( `${name} (${groupName})` )
                        } )
                    return acc
                }, [] )
                .sort()

            console.log( `${accountsArr.length} Account${accountsArr.length===1 ? '' : 's'} found.` )
            return true
        }

        console.log( 'No accounts found. Should test accounts be created?')
        const response = await inquirer.prompt( [
            {
                'type': 'confirm',
                'name': 'sure',
                'message': 'Yes/No',
                'default': true
            }
        ] )
console.log( response )
        if( !response['sure'] ) {
            return true
        }

        this.#easyMina.createAccounts( {
            'names': [ 'alice', 'bob', 'charlie' ],
            'networkName': 'berkeley',
            'groupName': 'a'
        } )

        return response
    }


    async #createEnvironment() {
        const status = this.#easyMina.getEnvironmentStatus()
        if( status['environmentReady'] ) {
            this.#easyMina.setEnvironment()
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

            !response['sure'] ? process.exit( 1 ) : ''
            this.#easyMina.setEnvironment()
            return true
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