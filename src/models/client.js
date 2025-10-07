class Client {
  constructor(partitionKey, rowKey, name, email, phone, cpf, address) {
    this.partitionKey = partitionKey;
    this.rowKey = rowKey;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.cpf = cpf;
    this.address = address;
    this.createdAt = new Date().toISOString();
  }
}

module.exports = Client;