const IoTData = require('../models/IoTData');

class IoTDataService {
  constructor() {
    this.latestData = null;
  }

  // Process and save IoT data
  async processIoTData(data) {
    try {
      console.log('Received IoT data:', data);
      
      // Parse timestamp if it's a string
      let timestamp = data.timestamp;
      if (typeof timestamp === 'string') {
        timestamp = new Date(timestamp.trim());
      }

      // Create new IoT data entry
      const iotData = new IoTData({
        humidity: data.humidity,
        temperature: data.temperature,
        distance: data.distance,
        timestamp: timestamp
      });

      // Save to database
      await iotData.save();
      
      // Store as latest data
      this.latestData = {
        humidity: data.humidity,
        temperature: data.temperature,
        distance: data.distance,
        timestamp: timestamp,
        receivedAt: new Date()
      };

      console.log('IoT data saved successfully');
      return iotData;
    } catch (error) {
      console.error('Error processing IoT data:', error);
      throw error;
    }
  }

  // Get latest IoT data
  getLatestData() {
    return this.latestData;
  }

  // Get all IoT data with pagination
  async getAllData(page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;
      const data = await IoTData.find()
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await IoTData.countDocuments();
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching IoT data:', error);
      throw error;
    }
  }
}

module.exports = new IoTDataService();