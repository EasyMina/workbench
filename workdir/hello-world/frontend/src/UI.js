const UI = class UI extends EventTarget {
    #config
    #state


    constructor() {
        super()
        this.#config = {
            'states': {
                'done': {
                    'className': 'step done-step',
                    'circleClassName': 'step-circle done-step',
                    'selectDisable': true,
                    'buttonDisable': true
                },
                'active': {
                    'className': 'step active-step',
                    'circleClassName': 'step-circle done-step',
                    'selectDisable': false,
                    'buttonDisable': false
                },
                'waiting': {
                    'className': 'step',
                    'circleClassName': 'step-circle',
                    'selectDisable': true,
                    'buttonDisable': true
                }
            },
            'dom': {
                'auro': {
                    'select': true
                },
                'o1js': {
                    'select': true
                },
                'smartContract': {
                    'select': true
                },
                'compile': {
                    'select': false
                }
            }
        }

        this.#state = {
            'activeKey': null
        }
    }


    changeStatusRows( { state } ) {
        console.log( 'disable')
        Object
            .keys( this.#config['dom'] )
            .forEach( key => this.changeStatusRow( { key, state } ) )

        return true
    }


    changeStatusRow( { key, state } ) {
        if( state === 'active' ) {
            this.#state['activeKey'] = key
        }
        const element = document.getElementById( key )
        element.className = this.#config['states'][ state ]['className']

        if( this.#config['dom'][ key ]['select'] ) {
            const select = document
                .querySelector( `#${key} select.step-dropdown` )
            select.disabled = this.#config['states'][ state ]['selectDisable']
        }

        const button = document
            .querySelector( `#${key} button.step-button` )
        button.disabled = this.#config['states'][ state ]['buttonDisable']

        const circle = element.firstElementChild;
        circle.className = this.#config['states'][ state ]['circleClassName']

        return true
    }


    setSelectOptions( { key, options } ) {
        const select = document
            .querySelector( `#${key} select.step-dropdown` )

        options
            .forEach( option => {
                const el = document.createElement( 'option' )
                el.text = option['text']
                el.value = option['value']
                select.appendChild( el )
            } )

        return true
    } 


    setResponseText( { key, rows } ) {
        const divs = document
            .querySelectorAll( `#${key} div.step-message` )

        rows
            .forEach( ( row, index ) => {
                divs[ index ].textContent = row
            } )

        return true
    }
    
    
    getSelectOption( { key } ) {
        const select = document
            .querySelector( `#${key} select.step-dropdown` )
        return select.options[ select.selectedIndex ].value
    }


    nextStep() {
        const keys = Object
            .keys( this.#config['dom'] )
        const index = keys
            .findIndex( a => a === this.#state['activeKey'] )

        if( keys.length === index ) {
            this.changeStatusRow( { 
                'key': keys[ index ], 
                'state': 'done'
            } )
        } else {
            this.changeStatusRow( { 
                'key': keys[ index ], 
                'state': 'done'
            } )

            this.changeStatusRow( { 
                'key': keys[ index + 1 ], 
                'state': 'active'
            } )
        }

        return true
    }
}