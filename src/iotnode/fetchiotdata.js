const mqtt = require('aws-iot-device-sdk-v2').mqtt;
const io = require('aws-iot-device-sdk-v2').io;
const iot = require('aws-iot-device-sdk-v2').iot;
const path = require('path');
const iotDataService = require('../services/iotDataService');

class IoTSubscriber {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // IoT Core connection configuration
      const config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(
        path.join(__dirname, '../../crt/e7d328f3fae76a829f35f14ff1c14dcb2432a984bd72a0a51c6db03d35136bbf-certificate.pem.crt'),
        path.join(__dirname, '../../crt/e7d328f3fae76a829f35f14ff1c14dcb2432a984bd72a0a51c6db03d35136bbf-private.pem.key')
      );

      config_builder.with_certificate_authority_from_path(
        undefined,
        path.join(__dirname, '../../crt/AmazonRootCA1.pem')
      );

      config_builder.with_clean_session(false);
      config_builder.with_client_id(`aquaflow-backend-${Date.now()}`);
      config_builder.with_endpoint(process.env.AWS_IOT_ENDPOINT);

      const config = config_builder.build();


  console.log('Connecting to AWS IoT Core...');
  const client = new mqtt.MqttClient();
  this.connection = client.new_connection(config);

  await this.connection.connect();
  this.isConnected = true;
  console.log('Connected to AWS IoT Core successfully');

  // Subscribe to IoT topic
  await this.subscribeToTopic();

    } catch (error) {
      console.error('Failed to connect to AWS IoT Core:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async subscribeToTopic() {
    try {
      const topic = process.env.AWS_IOT_TOPIC;
      
      console.log(`Subscribing to topic: ${topic}`);
      
      await this.connection.subscribe(
        topic,
        mqtt.QoS.AtLeastOnce,
        (topic, payload) => {
          this.handleMessage(topic, payload);
        }
      );

      console.log(`Successfully subscribed to topic: ${topic}`);
    } catch (error) {
      console.error('Failed to subscribe to topic:', error);
      throw error;
    }
  }

  handleMessage(topic, payload) {
    try {
      console.log(`Received message from topic ${topic}`);

      // Convert ArrayBuffer or Buffer to string
      let jsonString;
      if (payload instanceof ArrayBuffer) {
        jsonString = Buffer.from(payload).toString();
      } else if (Buffer.isBuffer(payload)) {
        jsonString = payload.toString();
      } else {
        jsonString = String(payload);
      }

      // Parse the JSON payload
      const data = JSON.parse(jsonString);
      console.log('Parsed data:', data);

      // Process and save the data
      iotDataService.processIoTData(data)
        .then(() => {
          console.log('Data processed and saved successfully');
        })
        .catch((error) => {
          console.error('Error processing data:', error);
        });

    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  async disconnect() {
    try {
      if (this.connection && this.isConnected) {
        await this.connection.disconnect();
        this.isConnected = false;
        console.log('Disconnected from AWS IoT Core');
      }
    } catch (error) {
      console.error('Error disconnecting from AWS IoT Core:', error);
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

module.exports = new IoTSubscriber();