export const config = {
    'server': {
        'port': 3001,
        'routes': {
            'build': {
                'source': 'build',
                'route': '/build'
            },
            'public': {
                'route': '/public'
            },
            'getAccounts': {
                'route': '/getAccounts'
            },
            'getContracts': {
                'route': '/getContracts'
            },
            'getLocalO1js': {
                'route': '/getLocalO1js'
            },
            'getSmartContracts': {
                'route': '/getSmartContracts'
            }
        }
    },
    'secret': {
        'fileName': '_.txt',
        'envKey': 'EASYMINA',
        'jsonKey': 'em'
    },
    'validate': {
        'folders': {
            'credentials': {
                'name': '.mina',
                'subfolders': {
                    'accounts': {
                        'name': 'accounts'
                    },
                    'contracts': {
                        'name': 'contracts'
                    }
                }
            },
            'workdir': {
                'name': 'projects',
                'subfolders': {
                    'name': null,
                    'default': 'hello-world',
                    'subfolders': {
                        'backend': {
                            'name': 'backend'
                        },
                        'frontend': {
                            'name': 'frontend'
                        },
                        'contracts': {
                            'name': 'contracts' 
                        }
                    }
                }
            }
        }, 
        'files': {
            'account': {
                'type': 'json',
                'keys': [
                    {
                        'name': 'name',
                        'key': 'header__name',
                        'validation': 'validate__values__string',
                        'type': 'string'
                    },
                    {
                        'name': 'groupName',
                        'key': 'header__groupName',
                        'validation': 'validate__values__string',
                        'type': 'string'
                    },
                    {
                        'name': 'publicKey',
                        'key': 'body__account__publicKey',
                        'validation': 'validate__values__minaPublicKey',
                        'type': 'string'
                    },
                    {
                        'name': 'privateKey',
                        'key': 'body__account__privateKey',
                        'validation': 'validate__values__minaPrivateKey',
                        'type': 'string'
                    }
                ]
            },
            'contract': {
                'type': 'json',
                'keys': [
                    {
                        'name': 'name',
                        'key': 'header__name',
                        'validation': 'validate__values__string',
                        'type': 'string'
                    },
                    {
                        'name': 'projectName',
                        'key': 'header__projectName',
                        'validation': 'validate__values__string',
                        'type': 'string'
                    },
                    {
                        'name': 'networkName',
                        'key': 'header__networkName',
                        'validation': 'validate__values__string',
                        'type': 'string'
                    },
                    {
                        'name': 'publicKey',
                        'key': 'body__account__publicKey',
                        'validation': 'validate__values__minaPublicKey',
                        'type': 'string'
                    },
                    {
                        'name': 'privateKey',
                        'key': 'body__account__privateKey',
                        'validation': 'validate__values__minaPrivateKey',
                        'type': 'string'
                    }
                ]
            },
            'importPayload': {
                'root': [
                    {
                        'name': 'projectName',
                        'key': 'projectName',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'name',
                        'key': 'name',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'description',
                        'key': 'description',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'readme',
                        'key': 'readme',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'contracts',
                        'key': 'contracts',
                        'validation': 'validate__values__string',
                        'type': 'array',
                        'required': true
                    },
                    {
                        'name': 'demos',
                        'key': 'demos',
                        'validation': 'validate__values__string',
                        'type': 'array',
                        'required': true
                    }
                ],
                'contracts': [
                    {
                        'name': 'name',
                        'key': 'name',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'description',
                        'key': 'description',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'readme',
                        'key': 'readme',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': false
                    },
                    {
                        'name': 'source',
                        'key': 'source',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'destination',
                        'key': 'destination',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    }
                ],
                'demos': [
                    {
                        'name': 'name',
                        'key': 'name',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'description',
                        'key': 'description',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'readme',
                        'key': 'readme',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': false
                    },
                    {
                        'name': 'type',
                        'key': 'type',
                        'validation': 'validate__values__workdirFolder',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'source',
                        'key': 'source',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'destination',
                        'key': 'destination',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': true
                    },
                    {
                        'name': 'youtube',
                        'key': 'youtube',
                        'validation': 'validate__values__string',
                        'type': 'string',
                        'required': false
                    }
                ]
            }
        },
        'values': {   
            'string': {
                'regex': /[a-zA-Z]+/,
                'description': 'Only string are allowed.'
            },
            'stringsAndDash': {
                'regex': /^[a-zA-Z]+(-[a-zA-Z]+)*$/,
                'description': "Only strings and hyphens are allowed, but hyphens should only appear in the middle."
            },
            'minaPublicKey': {
                'regex': /^B62[a-km-zA-HJ-NP-Z1-9]{52}$/,
                'description': "Allowed is a valid Mina public key format (starting with 'B62' followed by 52 alphanumeric characters)."
            },
            'minaPrivateKey': {
                'regex': /^EK[a-zA-Z0-9]+/,
                'description': "Allowed is a valid Mina private key format (starting with 'EK' followed by alphanumeric characters)."
            },
            'workdirFolder': {
                'regex': /^(frontend|interaction)$/,
                'description': "Allowed is input limited to either 'frontend' or 'interaction' with no other text allowed."
            },
            'youtubeVideo': {
                'regex': /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+(&\S*)?|^https?:\/\/youtu\.be\/[\w-]+/,
                'description': 'Allowed are only valid YouTube video URLs, covering standard and shortened formats.'
            }
        }
    },
    'contracts': {
        'disclaimer': 'Do not share this file with anyone.'
    },
    'accounts': {
        'disclaimer': 'Do not share this file with anyone.', 
        'maxTries': 25000,
        'personas': {
            'chars': [
                'a', 'b', 'c', 'd', 'e', 'f',
                'g', 'h', 'i', 'j', 'k', 'm',
                'n', 'o', 'p', 'q', 'r', 's',
                't', 'u', 'v', 'w', 'x', 'y',
                'z'
            ],
            'other': '0'
        },
        'pattern': {
            'logic': {
                'and': [
                    {
                        'value': null,
                        'description': 'Search for a given character.',
                        'method': 'inSuccession',
                        'option':  'endsWith', // 'inBetween', // 'endsWith',
                        'expect': {
                            'logic': '>=',
                            'value': 2
                        }
                    }
                ]
            }
        }
    },
    'networks': {
        'supported': [ 'berkeley' ],
        'berkeley': {
            'explorer': {
                'wallet': 'https://minascan.io/berkeley/account/{{publicKey}}',
                'transaction': 'https://minascan.io/berkeley/tx/{{txHash}}'
            },
            'faucet': {
                'url': 'https://faucet.minaprotocol.com/api/v1/faucet',
                'id': 'berkeley-qanet'
            }
        },
        'testworld2': {
            'explorer': {
                'wallet': 'https://minascan.io/testworld/account/{{publicKey}}',
                'transaction': 'https://minascan.io/testworld/tx/{{txHash}}'
            },
            'faucet': {
                'url': 'https://faucet.minaprotocol.com/api/v1/faucet',
                'id': 'itn-qanet'
            }
        },
        'devnet': {
            'explorer': {
                'wallet': 'https://devnet.minaexplorer.com/wallet/{{publicKey}}',
                'transaction': 'https://devnet.minaexplorer.com/transaction/{{txHash}}'
            },
            'faucet': {
                'url': 'https://faucet.minaprotocol.com/api/v1/faucet',
                'id': 'devnet'
            }
        }
    },
    'git': {
        'fileName': './gitignore'
    },
    'typescript': {
        'template': {
            'compilerOptions': {
                'target': 'ES2019',
                'module': 'es2022',
                'lib': [ 'dom', 'esnext' ],
                'outDir': null,
                'rootDir': null,
                'strict': true,
                'strictPropertyInitialization': false, // to enable generic constructors, e.g. on CircuitValue
                'skipLibCheck': true,
                'forceConsistentCasingInFileNames': true,
                'esModuleInterop': true,
                'resolveJsonModule': true,
                'moduleResolution': 'node',
                'experimentalDecorators': true,
                'emitDecoratorMetadata': true,
                'allowJs': true,
                'declaration': false,
                'sourceMap': false,
                'noFallthroughCasesInSwitch': true,
                'allowSyntheticDefaultImports': true,
                'isolatedModules': true,
                // 'outFile': null
            },
            'include': null,
            'exclude': []
        },
        'fileName': 'tsconfig.json',
        'buildFolderName': 'build'
    },
    'importer': {
        'localPhrase': 'change the world with zk tech',
        'rootFolder': 'validate__folders__workdir__name',
        'subfolders': [
            'validate__folders__workdir__subfolders__subfolders__backend__name',
            'validate__folders__workdir__subfolders__subfolders__contracts__name',
            'validate__folders__workdir__subfolders__subfolders__frontend__name'
        ],
        'suffixs': [ '.js', '.mjs', '.ts', '.png', '.html', '.css', '.json' ]
    }
}