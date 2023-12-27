const ui = new UI()


const Step = class Step extends EventTarget {
    #config
    #state


    constructor() {
        super()
        this.#config = {
            'auro': {
                'validNetworks': [ 'devnet', 'berkeley', 'testworld2', 'mainnet' ],
                'options': [
                    { 'text': 'Berkeley', 'value': 'berkeley' },
                    { 'text': 'Testworld 2', 'value': 'testworld2' },
/*
                    { 'text': 'Mainnet', 'value': 'mainnet' },
                    { 'text': 'Dev Net', 'value': 'devnet' }
*/
                ]
            },
            'o1js': {
                'options': [
                    { 'text': 'CDN', 'value': 'https://cdn.jsdelivr.net/npm/o1js' },
                    { 'text': 'Local', 'value': './src....' }
                ]
            },
            'smartContract': {

            }, 
            'compile': {

            }
        }
    }


    init() {
        this.#state = {
            'auro': {
                'exists': false,
                'account': null,
                'network': null
            },
            'o1js': {
                'url': null
            },
            'smartContract': {
                'url': null
            }
        }

        this.#addSelectOptions()
        ui.changeStatusRows( { 'state': 'waiting' } )
        ui.changeStatusRow( { 'state': 'active', 'key': 'auro' } )

        return true
    }


    async buttonPressed( { key } ) {
        switch( key ) {
            case 'auro':
                await this.#setAuro()
                break
            case 'o1js':
                await this.#setImport()
                break
            case 'smartContract': 
                await this.#setSmartContract()
                break
            case 'compile':
                break
            default:
                console.log( `Button with the key '${key}' not known.` )
                break
        }

        this.#updateGlobalVariable()
        return true
    }


    #addSelectOptions() {
        ui.setSelectOptions( { 
            'key': 'auro', 
            'options': this.#config['auro']['options'] 
        } )

        ui.setSelectOptions( { 
            'key': 'o1js', 
            'options': this.#config['o1js']['options']
        } )
    }


    async #setAuro() {
        const validation = await this.#validateSetAuro()
        const [ messages, comments, accounts, network ] = validation
        this.#printMessages( { messages, comments } )
        this.#state['auro']['exists'] = messages.length === 0 ? true : false
        if( !this.#state['auro']['exists'] ) { 
            const rows = [ messages.join(', ' ), '' ]
            ui.setResponseText( { 'key': 'auro', rows } )
            return true 
        }

        this.#state['auro']['account'] = accounts[ 0 ]

        const targetChain = ui.getSelectOption( { 'key': 'auro' } )
        if( network['chainId'] !== targetChain ) {
            await mina.switchChain( { 'chainId': targetChain } )
            const newNetwork = await mina.requestNetwork()
            this.#state['auro']['network'] = newNetwork['chainId']
        } else {
            this.#state['auro']['network'] = network['chainId']
        }

        const message = `Account: ${this.#state['auro']['account']}, Network: ${this.#state['auro']['network']}.`
        const address = `${this.#state['auro']['account'].substring(0, 8)}...${this.#state['auro']['account'].substring( 51, 55 )}`
        ui.setResponseText( {
            'key': 'auro',
            'rows': [ `Account: ${address}`, `Network: ${this.#state['auro']['network']}`]
        } )
        ui.nextStep()

        return true
    }


    async #validateSetAuro() {
        const messages = []
        const comments = []
        let accounts
        let network

        if( typeof mina === 'undefined' ) {
            messages.push( `Auro Wallet is not available.` )
        }

       if( messages.length === 0 ) {
            try {
                accounts = await mina.requestAccounts()
            } catch( e ) {
                messages.push( `Auro .requestAccounts() failed. ${e}` )
            }

            try {
                network = await mina.requestNetwork()
            } catch( e ) {
                messages.push( `Auro .requestNetwork() failed. ${e}` )
            }

            if( !Array.isArray( accounts ) ) {
                messages.push( `Account is not array.` )
            } else if( accounts.length === 0 ) {
                messages.push( `Not account connected.` ) 
            } else {
                comments.push( `${accounts.length} Account${accounts.length === 0 ? '' : 's' } connected (${accounts.join( ', ' )}).`)
            }


            if( typeof network !== 'object' ) {
                messages.push( `Network is not object.` )
            } else if( !network.hasOwnProperty( 'chainId' ) ) {
                messages.push( `Network has not the key 'chainId'.` ) 
            } else if( !this.#config['auro']['validNetworks'].includes( network['chainId'] ) ) {
                messages.push( `Network with the value '${network}' is not valid.` )
            } else {
                comments.push( `Network is set to ${network['chainId']}.` )
            }
       }

        return [ messages, comments, accounts, network ]
    }


    async #setImport() {
        const url = ui.getSelectOption( { 'key': 'o1js' } )
        console.log( 'url', url )

        o1js = await import( url )
        this.#state['o1js']['url'] = url

        ui.setResponseText( {
            'key': 'o1js',
            'rows': [ `Succesful loaded.` ]
        } )
        ui.nextStep()

        return true
    }


    async #setSmartContract() {

        return true
    }


    #updateGlobalVariable() {
        easymina = Object
            .entries( this.#state )
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a
                !Object.hasOwn( acc, key ) ? acc[ key ] = {} : ''
                Object
                    .entries( value )
                    .forEach( b => {
                        const [ k, v ] = b
                        acc[ key ][ k ] = v
                    } )
                return acc
            }, {} )

        return true
    }


    #printMessages( { messages=[], comments=[] } ) {
        const n = [
            [ comments, 'Comment', false ],
            [ messages, 'Error', true ]
        ]
            .forEach( ( a, index ) => {
                const [ msgs, headline, stop ] = a
                msgs
                    .forEach( ( msg, rindex, all ) => {
                        rindex === 0 ? console.log( `\n${headline}${all.length > 1 ? 's' : ''}:` ) : ''
                        console.log( `  - ${msg}` )
                        if( ( all.length - 1 ) === rindex ) {
                            if( stop === true ) {

                            }
                        }
                    } )
            } )
    
        return true
    }
}