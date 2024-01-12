import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter a long data URL string:\n', (input) => {
  console.log(`You entered the following data URL string:\n${input}`);
  rl.close();
});