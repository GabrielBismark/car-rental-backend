class Vehicle {
  constructor(partitionKey, rowKey, brand, model, year, plate, dailyPrice, available = true, imageUrl = '') {
    this.partitionKey = partitionKey;
    this.rowKey = rowKey;
    this.brand = brand;
    this.model = model;
    this.year = year;
    this.plate = plate;
    this.dailyPrice = dailyPrice;
    this.available = available;
    this.imageUrl = imageUrl;
    this.createdAt = new Date().toISOString();
  }
}

module.exports = Vehicle;