import { EasyMina } from './../src/EasyMina.mjs'

const easymina = new EasyMina()
easymina.init()


await easymina.importProject( { 'projectPath': 'demo' } )