"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var body_parser_1 = require("body-parser");
var app = express_1();
app.use(body_parser_1.json());
var errorResponses = {
    invalidApiKey: {
        error: {
            type: 'invalid_request',
            message: 'API key not provided or invalid API key used',
            code: 'IR_01'
        }
    },
    paymentNotFound: {
        error: {
            type: 'not_found',
            message: 'Payment not found',
            code: 'NF_01'
        }
    },
    invalidPaymentAmount: {
        error: {
            type: 'invalid_request',
            message: 'Invalid payment amount',
            code: 'IR_02'
        }
    },
    paymentAlreadyCaptured: {
        error: {
            type: 'invalid_request',
            message: 'Payment already captured',
            code: 'IR_03'
        }
    },
    paymentAlreadyCancelled: {
        error: {
            type: 'invalid_request',
            message: 'Payment already cancelled',
            code: 'IR_04'
        }
    },
    paymentAlreadyRefunded: {
        error: {
            type: 'invalid_request',
            message: 'Payment already refunded',
            code: 'IR_05'
        }
    }
};
app.use(function (req, res, next) {
    var apiKey = req.headers['api-key'];
    console.log('API Key:', apiKey);
    if (!apiKey || apiKey !== 'valid_api_key') {
        return res.status(401).json(errorResponses.invalidApiKey);
    }
    next();
});
app.use(function (req, res, next) {
    var amount = req.body.amount;
    if (amount && amount <= 0) {
        return res.status(400).json(errorResponses.invalidPaymentAmount);
    }
    next();
});
app.use('/payments/:payment_id', function (req, res, next) {
    var payment_id = req.params.payment_id;
    if (payment_id !== 'test_payment_id') {
        return res.status(404).json(errorResponses.paymentNotFound);
    }
    next();
});
app.use('/payments/:payment_id/capture', function (req, res, next) {
    var status = req.body.status;
    if (status === 'succeeded') {
        return res.status(400).json(errorResponses.paymentAlreadyCaptured);
    }
    next();
});
app.use('/payments/:payment_id/cancel', function (req, res, next) {
    var status = req.body.status;
    if (status === 'cancelled') {
        return res.status(400).json(errorResponses.paymentAlreadyCancelled);
    }
    next();
});
app.use('/payments/:payment_id/refund', function (req, res, next) {
    var status = req.body.status;
    if (status === 'refunded') {
        return res.status(400).json(errorResponses.paymentAlreadyRefunded);
    }
    next();
});
app.use(function (req, res, next) {
    var apiKey = req.headers['api-key'];
    if (!apiKey || apiKey !== 'valid_api_key') {
        return res.status(401).json(errorResponses.invalidApiKey);
    }
    next();
});
app.post('/payments', function (req, res) {
    var mockResponse = {
        payment_id: 'test_payment_id',
        client_secret: 'test_client_secret',
        amount: 1000,
        currency: 'USD',
        status: 'succeeded',
        capture_method: 'automatic',
        setup_future_usage: 'off_session',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        captured_at: new Date().toISOString(),
        refunded_at: new Date().toISOString(),
        voided_at: new Date().toISOString(),
        session_data: undefined
    };
    res.json(mockResponse);
});
app.get('/payments/:payment_id', function (req, res) {
    var mockResponse = {
        payment_id: 'test_payment_id',
        client_secret: 'test_client_secret',
        amount: 1000,
        currency: 'USD',
        status: 'succeeded',
        capture_method: 'automatic',
        setup_future_usage: 'off_session',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        captured_at: new Date().toISOString(),
        refunded_at: null,
        voided_at: null,
        session_data: undefined
    };
    res.json(mockResponse);
});
app.post('/payments/:payment_id/capture', function (req, res) {
    var payment_id = req.params.payment_id;
    var mockResponse = {
        payment_id: payment_id,
        client_secret: 'test_client_secret',
        amount: 1000,
        currency: 'USD',
        status: 'succeeded',
        capture_method: 'automatic',
        setup_future_usage: 'off_session',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        captured_at: new Date().toISOString(),
        refunded_at: null,
        voided_at: null,
        session_data: undefined
    };
    res.json(mockResponse);
});
app.post('/payments/:payment_id/cancel', function (req, res) {
    var payment_id = req.params.payment_id;
    var mockResponse = {
        payment_id: payment_id,
        client_secret: 'test_client_secret',
        amount: 1000,
        currency: 'USD',
        status: 'cancelled',
        capture_method: 'automatic',
        setup_future_usage: 'off_session',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
        confirmed_at: null,
        captured_at: null,
        refunded_at: null,
        voided_at: new Date().toISOString(),
        session_data: undefined
    };
    res.json(mockResponse);
});
app.post('/payments/:payment_id/refund', function (req, res) {
    var payment_id = req.params.payment_id;
    var mockResponse = {
        payment_id: payment_id,
        client_secret: 'test_client_secret',
        amount: 1000,
        currency: 'USD',
        status: 'refunded',
        capture_method: 'automatic',
        setup_future_usage: 'off_session',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        captured_at: new Date().toISOString(),
        refunded_at: new Date().toISOString(),
        voided_at: null,
        session_data: undefined
    };
    res.json(mockResponse);
});
app.listen(3000, function () {
    console.log('Mock server is running on port 3000');
});
exports.default = app;
