'use strict';

const mqtt = require('mqtt');

module.exports = class OrchestraTelemetry {

    /**
     * @param {Object} options 
     * @param {String} companyUUID Company UUID (obtainable from control.orchestra.it)
     * @param {String} [options.environment=OrchestraTelemetry.ENVIRONMENTS.PROD] Which environment the data is sent to. It must be one of OrchestraTelemetry.ENVIRONMENTS
     */
    constructor(options = {}) {
        const {
            companyUUID,
            environment = OrchestraTelemetry.ENVIRONMENTS.PROD
        } = options;

        const validEnv = Object.values(OrchestraTelemetry.ENVIRONMENTS).includes(environment)
        if (false === validEnv)
            throw new Error(`Invalid Orchestra environment "${environment}"`);
        this._config = OrchestraTelemetry._ENVIRONMENTS_CONFIG[environment];

        // TODO: Check that companyUUID is a UUIDv4
        if (typeof companyUUID !== 'string' && companyUUID instanceof String === false)
            throw new Error(`companyUUID is not a string! "${companyUUID}"`);
        this.companyUUID = companyUUID;
    }


    static get ENVIRONMENTS() {
        return Object.freeze({
            STAGE: 'STAGE',
            PROD: 'PROD'
        });
    }


    static get _ENVIRONMENTS_CONFIG() {
        return Object.freeze({
            STAGE: {
                MQTT_HOST: 'mqtt://mqtt.stage.orchestra.it',
            },
            PROD: {
                MQTT_HOST: 'mqtt://mqtt.orchestra.it',
            }
        })
    }


    static get SENSOR_TYPES() {
        return Object.freeze({
            PERCENTAGE: 'PERCENTAGE',
        });
    }


    /**
     * 
     * @param {Object} options
     * @param {String} options.username MQTT username
     * @param {String} options.password MQTT password
     */
    async connect(options = {}) {
        const { username, password } = options;

        const url = this._config.MQTT_HOST;
        this._client = mqtt.connect(url, { username, password });

        return new Promise((resolve, reject) => {
            this._client.on('connect', _ => {
                console.log(`Connected to ${url}`);
                resolve();
            });
            this._client.on('error', err => {
                console.error(err);
                reject(err);
            });
        });
    }


    /**
     * 
     * @param {Object} options 
     * @param {Any} options.value It depends on the type of sensor
     * @param {String} options.sensorType Must be one of OrchestraTelemetry.SENSOR_TYPES
     * @param {String} options.sensorId Sensor id (obtained from control.orchestra.it)
     * @param {Object} [options.extra] Additional data
     */
    async sendData(options = {}) {
        const { value, sensorType, sensorId, extra = {} } = options;

        // Check that sensorId is a string
        if (typeof sensorId !== 'string' && sensorId instanceof String === false)
            throw new Error(`sensorId is not a string! "${sensorId}"`);

        // Check valid sensorType
        if (false === Object.values(OrchestraTelemetry.SENSOR_TYPES).includes(sensorType))
            throw new Error(`Invalid sensorType "${sensorType}"`);

        // Check "values"
        if (value === undefined)
            throw new Error(`Invalid value "undefined"`);

        // Check that "extra" is a dictionary
        if (!extra || extra.constructor !== Object)
            throw new Error(`options.extra is not an Object "${JSON.stringify(extra)}"`);

        const topic = `/Telemetry/v1/${this.companyUUID}/${sensorType}/${sensorId}/`;
        const message = {
            date: new Date(),
            version: 'v1', // TODO: Handle support for different versions
            value,
            extra,
        };

        console.log(`sending`, topic, message);

        return new Promise((resolve, reject) => {
            this._client.publish(topic, JSON.stringify(message), { qos: 2 }, err => {
                if (err) return reject(err);
                resolve();
            });
        })
    }
}