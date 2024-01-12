import inquirer from 'inquirer'
import figlet from 'figlet'

import { EasyMina } from './EasyMina.mjs'
import readline from 'readline'


export class CLI {
    #config
    #easyMina

    constructor() {
        this.#config = {}
        this.#easyMina = new EasyMina()
        this.#easyMina.init( { 
            encryption: true,
            setSecret: false
        } )

        return true
    }

    
    async start() {
        this.#addHeadline2()

        await this.#createEnvironment()
        await this.#checkDeployer()
        await this.#checkProject()

        await this.#isOkMenu()

        // await this.start()
        return true
    }


    async #isOkMenu() {
        const options = [
            'Add Accounts',
            'Add a Template',
            'Export Project', 
            'Import Project',
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
                await this.#addAccounts()
                break
            case 'Add a Template':
                await this.#addTemplate()
                break
            case 'Export Project':
                await this.#exportProject()
                break
            case 'Import Project':
                await this.#importProject()
                // TODO
                break
            case 'Start Server':
                await this.#addServer()
                // TODO
                break
            default:
                break
        }


        return true
    }


    async #addTemplate() {
        const templates = this.#easyMina.getTemplateNames()
        const questions = [
            {
              type: 'list',
              name: 'template',
              choices: templates,
              message: 'Choose project name:',
            },
            {
                type: 'input',
                name: 'projectName',
                message: 'Enter your name (optional):',
                default: '',
                validate: function ( input ) {
                    return input.trim() !== '' ? true : 'Project Name can not be empty.'
                }
            }
        ]

        const { template, projectName } = await inquirer.prompt( questions )

        const result = await this.#easyMina.importProject( { 
            'url': `local://${template}`,
            'phrase': 'change the world with zk tech',
            projectName
            //'url': 'https://gist.githubusercontent.com/a6b8/a05d605f04972e67eccf998587b9471a/raw/089553e6e8e071f3e149be02bbacb7e42b727483/gistfile1.txt',
            // 'phrase': 'test'
        } )
        console.log( )

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

        let { names, groupName } = response
        names = names
            .split( ',' )
            .map( name => name.trim() )
        await this.#easyMina
            .createAccounts( { names, 'networkName': 'berkeley', groupName } )

        return true
    }


    async #addServer() {
        this.#easyMina.setSecret()
        const projectNames = this.#easyMina.getProjectNames()
        const questions = [
            {
              type: 'list',
              name: 'projectName',
              choices: projectNames,
              message: 'Enter the project name:',
            }
        ]

        const { projectName } = await inquirer.prompt( questions )
        this.#easyMina.startServer( { projectName } )

        return true
    }


    async #exportProject() {
        const projectNames = this.#easyMina.getProjectNames()

        const questions = [
            {
                type: 'list',
                name: 'projectName',
                choices: projectNames,
                message: 'Enter the project name:'
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
                type: 'confirm',
                name: 'encryption',
                message: 'Do you want to encrypt the file?',
                default: true
            }
        ]

        const answers = await inquirer.prompt( questions )
        const { projectName, name, description, encryption } = answers

        let phrase = undefined
        if( encryption ) {
            const resp = await inquirer.prompt( [
                {
                    type: 'input',
                    name: 'phrase',
                    message: 'Enter an export phrase:',
                    validate: function (input) {
                      return input.trim() !== '' ? true : 'Please enter a non-empty export phrase.';
                    },
                  }
            ] )
            phrase = resp['phrase']
        } 

        this.#easyMina.exportProject( { projectName, name, description, phrase, encryption } )
        return true
    }


    async #importProject() {
        const { type } = await inquirer.prompt( [
            {
                'type': 'list',
                'name': 'type',
                'choices': [ 'url', 'dataurl' ]
            }
        ] )

        let  url
        switch( type ) {
            case 'url':
                const resp = await inquirer.prompt( [
                    {
                        'type': 'input',
                        'name': 'url',
                        'message': 'URL: ',
                        'default': ''
                    }
                ] )
                url = resp.url
                break
            case 'dataurl':
                function questionAsync( question ) {
                    return new Promise( ( resolve ) => {
                        const rl = readline.createInterface( {
                            'input': process.stdin,
                            'output': process.stdout
                        } )
                  
                        rl.question( 
                            question, 
                            ( answer ) => {
                                rl.close()
                                resolve( answer )
                            } 
                        )
                    } )
                }

                url =  await questionAsync('Enter a long data URL string:\n')
                break
        }

        const questions = [
            {
                'type': 'input',
                'name': 'phrase',
                'message': 'Enter your decryption phrase:',
                'default': ''
            },
            {
                'type': 'input',
                'name': 'projectName',
                'message': 'Enter a Project Name:',
                'default': '',
                validate: function ( input ) {
                    return input.trim() !== '' ? true : 'Project Name can not be empty.'
                }
            }
        ]
          
        const response = await inquirer.prompt( questions )
        const { phrase, projectName } = response

        this.#easyMina.importProject( { url, phrase, projectName } )
        return true 
    }


    async #checkProject() {
        const projects = this.#easyMina.getProjectNames()
        if( projects.length !== 0 ) {
            console.log( `${projects.length} Project${projects.length === 1 ? '' : 's'} found.` )
            return true
        }

        console.log( `No project found. Would you like to load an example?` )
        await this.#addTemplate()
        return true
    }


    async #checkDeployer() {
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

        if( !response['sure'] ) {
            return true
        }

        await this.#easyMina.createAccounts( {
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