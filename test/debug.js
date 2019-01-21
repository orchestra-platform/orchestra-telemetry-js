'use strict';

const OrchestraTelemetry = require('../index.js');

const CONFIG = require('./debug-config.js');

(async _ => {

    const ot = new OrchestraTelemetry({
        environment: OrchestraTelemetry.ENVIRONMENTS.STAGE,
        companyUUID: CONFIG.COMPANY_UUID,
    });

    await ot.connect({
        username: CONFIG.MQTT.USERNAME,
        password: CONFIG.MQTT.PASSWORD,
    });

    await ot.sendData({
        value: 1000,
        sensorType: OrchestraTelemetry.SENSOR_TYPES.PERCENTAGE,
        sensorId: 'test-percentage',
        // extra: {}
    });

    debugger;

})();
