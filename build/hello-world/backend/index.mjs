import { Mina, AccountUpdate, PrivateKey } from 'o1js';
import { Square } from './../../../build/hello-world/backend/Square.js';
const square = new Square();
const compiled = await square.compile();
/*
let o1 = await import( 'https://cdn.jsdelivr.net/npm/o1js' )
let { Field, SmartContract, State } = o1

class HelloWorld extends SmartContract {
    constructor( address ) {
        super( address )
        this.x = State()
    }

    update( dx ) {
        let x = this.x.getAndAssertEquals()
        this.x.set( x.add( dx ) )
    }
}


o1.declareState( HelloWorld, { x: Field } )
o1.declareMethods( HelloWorld, { update: [ Field ] } )

let { Mina, AccountUpdate, PrivateKey } = o1
let network = Mina.Network( 'https://proxy.berkeley.minaexplorer.com/graphql' )

Mina.setActiveInstance( network )
*/
//# sourceMappingURL=index.mjs.map