const buchstabenArray = [];

for (let buchstabe = 'a'.charCodeAt(0); buchstabe <= 'k'.charCodeAt(0); buchstabe++) {
  buchstabenArray.push(String.fromCharCode(buchstabe));
}

for (let buchstabe = 'm'.charCodeAt(0); buchstabe <= 'z'.charCodeAt(0); buchstabe++) {
  buchstabenArray.push(String.fromCharCode(buchstabe));
}

console.log(buchstabenArray);
