class Rental {
  constructor(partitionKey, rowKey, vehicleId, clientId, startDate, endDate, totalPrice, status = 'active') {
    this.partitionKey = partitionKey;
    this.rowKey = rowKey;
    this.vehicleId = vehicleId;
    this.clientId = clientId;
    this.startDate = startDate;
    this.endDate = endDate;
    this.totalPrice = totalPrice;
    this.status = status;
    this.createdAt = new Date().toISOString();
  }
}

module.exports = Rental;