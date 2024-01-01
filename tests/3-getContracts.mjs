import { EasyMina } from './../src/EasyMina.mjs'

const easymina = new EasyMina()
const result = easymina
    .init()
    .getContracts()