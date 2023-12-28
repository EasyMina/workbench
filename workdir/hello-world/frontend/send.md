<img src="/content/logo.png" alt="Logo" height="50">

# Hello World

This demo demonstrates working with zkApp Contracts. Files are stored in various directories to assist in getting started with zkApp programming.

## 0. Fund Account

This step needs to be performed only once to create accounts that will be used for interactions with the blockchain. Test tokens will be loaded onto the newly created accounts automatically.

### Initialize EasyMina 

```bash
npm -g easymina
easymina init
```

### Fund Auro Wallet Account

`./workdir/hello-world/backend/fundAuroWallet.mjs`
```
node ./workdir/hello-world/backend/fundAuroWallet.mjs
```



## 1. Deploy

### Step 1
**Compile to JavaScript**  
Before you can upload the contract to the test network, you need to compile the contract from TypeScript to JavaScript.

```bash
tsc
```

### Step 2.1

You can check the following steps beforehand. If the default settings are in place, no changes are required.

**Import Contract**

The compiled contract is stored in the `./build` folder and is then imported into the script.

```js
import { Square } from '../../../build/hello-world/backend/Square.js'
```

**Choose Network**  
By default, we use the Berkeley test network.

```js
const Berkeley = Mina.Network( { 
    'mina': 'https://berkeley.minascan.io/graphql' 
} )
```

**Choose Account**  
Choose a funded account that will pay the transaction fee later.

```js
const deployer = easyMina.getAccount( {
    'name': 'alice',
    'groupName': 'a'
} )
```

### Step 2.2
**Deploy**
Now we can deploy the contract to the test network.

`./workdir/hello-world/backend/deploy.mjs`
```bash
node hello-world/backend/deploy.mjs
```

## 2. Start Server

**Start Server**
```bash
easymina server
```

**Choose Project**
```
> hello-world
```

### Send

Use inter
